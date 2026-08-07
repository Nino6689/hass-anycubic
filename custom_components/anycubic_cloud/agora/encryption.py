"""Wrapping the channel encryption key for Agora's join message.

Agora's "built-in encryption" is not end-to-end for a web-role client: the
browser's own leg is ordinary DTLS-SRTP, and it is the SD-RTN edge that
encrypts and decrypts the media. So the edge has to be handed the AES secret,
and the join message carries it RSA-OAEP wrapped under a public key that is
hardcoded in the Web SDK.

That means a non-browser client never has to implement AES-256-GCM2 at all --
it only has to reproduce this wrap exactly.

Adapted from `Jezza34000/homeassistant_petkit` (MIT), whose Agora client is in
turn based on the original reverse engineering by @mikey0000. PetKit's channels
are unencrypted, so this module has no counterpart there; it is derived
straight from `agora-rtc-sdk-ng` v4.24.0.
"""

from __future__ import annotations

import base64
from functools import lru_cache

from cryptography.exceptions import UnsupportedAlgorithm
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa

from .errors import AgoraEncryptionError

# Lifted verbatim from agora-rtc-sdk-ng 4.24.0, where it is fed to
# `crypto.subtle.importKey("spki", ..., {name: "RSA-OAEP", hash: "SHA-256"})`.
# It is a 1024-bit key -- small by current standards, but it is Agora's, and
# using anything else would simply make the gateway reject the join.
_AGORA_PUBLIC_KEY_SPKI_B64: str = (
    "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDCMnXAHkKIGAM+x4N22gCI+Wyu"
    "STM9ztkT3uYslTT2PuKmZfPzhH6kVdO7PTjGCOZnAsyb3oTtWat0KcxQ4jxvqQV+"
    "HvYl3iI1Yd4vl2c3qRMJPLtRDfNxa2Mcxgq7e9aEUibzdd0st+OJAy3tOj/Y0aVy"
    "xQiYDz3vqa6bP29adwIDAQAB"
)


@lru_cache(maxsize=1)
def _agora_public_key() -> rsa.RSAPublicKey:
    """Load and cache Agora's key-wrapping public key."""
    try:
        key = serialization.load_der_public_key(
            base64.b64decode(_AGORA_PUBLIC_KEY_SPKI_B64)
        )
    except (ValueError, UnsupportedAlgorithm) as err:
        raise AgoraEncryptionError(
            f"Agora's bundled public key could not be loaded: {err}"
        ) from err

    if not isinstance(key, rsa.RSAPublicKey):
        raise AgoraEncryptionError("Agora's bundled public key is not an RSA key")

    return key


def wrap_channel_key(encryption_key: str) -> str:
    """Return the base64 `aes_secret` value for the join message.

    The key goes in as the RAW STRING encoded to UTF-8 bytes. It looks like
    32 characters of hex and the temptation is to decode it -- do not. The SDK
    calls `new TextEncoder().encode(secret)` on whatever `setEncryptionConfig`
    was given, and Anycubic's own client passes `encryption_key.toString()`,
    so the plaintext is 32 bytes of ASCII, not 16 bytes of decoded hex. Hex
    decoding produces a wrap the gateway rejects with ILLEGAL_AES_PASSWORD.
    """
    if not encryption_key:
        raise AgoraEncryptionError("No channel encryption key to wrap")

    plaintext = encryption_key.encode("utf-8")

    # RSA-OAEP with SHA-256 under a 1024-bit key leaves 62 bytes of room. A
    # well-formed key uses 32 of them; anything longer is not something we can
    # send, and failing here beats a mystifying gateway rejection.
    max_plaintext = _agora_public_key().key_size // 8 - 2 * hashes.SHA256.digest_size - 2
    if len(plaintext) > max_plaintext:
        raise AgoraEncryptionError(
            f"Channel key is {len(plaintext)} bytes, too long to wrap "
            f"(maximum {max_plaintext})"
        )

    try:
        ciphertext = _agora_public_key().encrypt(
            plaintext,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None,
            ),
        )
    except ValueError as err:
        raise AgoraEncryptionError(f"Failed to wrap the channel key: {err}") from err

    return base64.b64encode(ciphertext).decode("ascii")


def validate_kdf_salt(encryption_kdf_salt: str) -> str:
    """Check the salt decodes to 32 bytes and return it UNCHANGED.

    The salt travels as base64 end to end. The Web SDK takes a 32-byte
    `Uint8Array`, and its join builder base64-encodes it again -- so the value
    on the wire is byte-for-byte the string the Anycubic cloud handed us. Do
    not decode and re-encode it; there is nothing to normalise and doing so
    only risks changing the padding.
    """
    try:
        decoded = base64.b64decode(encryption_kdf_salt, validate=True)
    except (ValueError, TypeError) as err:
        raise AgoraEncryptionError("Channel salt is not valid base64") from err

    if len(decoded) != 32:
        raise AgoraEncryptionError(
            f"Channel salt decodes to {len(decoded)} bytes, expected 32"
        )

    return encryption_kdf_salt
