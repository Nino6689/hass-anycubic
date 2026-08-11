// Compiles printer_art.ts alone so the render matrix can import it in node.
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'src/components/printer_card/printer_view/printer_art.ts',
  output: { file: 'test/.build/printer_art.js', format: 'es' },
  plugins: [resolve(), typescript({ tsconfig: './tsconfig.json', outDir: 'test/.build', declaration: false })],
  external: ['lit'],
};
