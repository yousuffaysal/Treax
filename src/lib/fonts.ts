import { Inter, Manrope, JetBrains_Mono, Hind_Siliguri, Baloo_Da_2 } from 'next/font/google';

export const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
});

export const manrope = Manrope({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const hindSiliguri = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-hind',
  display: 'swap',
});

export const balooDa2 = Baloo_Da_2({
  subsets: ['bengali', 'latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-baloo',
  display: 'swap',
});

export const fontVariables = [
  inter.variable,
  manrope.variable,
  jetbrainsMono.variable,
  hindSiliguri.variable,
  balooDa2.variable,
].join(' ');
