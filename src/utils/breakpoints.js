/**
 * BREAKPOINTS.JS/TS - SISTEMA GLOBAL
 * 
 * Archivo: src/utils/breakpoints.js (o .ts)
 * 
 * Uso:
 * import { breakpoints, useBreakpoint, isDesktop } from '@/utils/breakpoints';
 */

// === CONFIGURACIÓN DE BREAKPOINTS ===
export const breakpoints = {
  mobileSm: 480,
  mobile: 767,
  tablet: 768,
  desktop: 1024,
  desktopLg: 1400,
} as const;

// === NOMBRES DE BREAKPOINTS ===
export type BreakpointName = keyof typeof breakpoints;

export const breakpointNames: BreakpointName[] = [
  'mobileSm',
  'mobile', 
  'tablet',
  'desktop',
  'desktopLg'
];

// === MEDIA QUERIES PARA JS ===
export const mediaQueries = {
  mobileSm: `(max-width: ${breakpoints.mobileSm}px)`,
  mobile: `(max-width: ${breakpoints.mobile}px)`,
  tablet: `(min-width: ${breakpoints.tablet}px) and (max-width: ${breakpoints.desktop - 1}px)`,
  desktop: `(min-width: ${breakpoints.desktop}px)`,
  desktopLg: `(min-width: ${breakpoints.desktopLg}px)`,
  
  // Helpers adicionales
  mobileDown: `(max-width: ${breakpoints.mobile}px)`,
  tabletUp: `(min-width: ${breakpoints.tablet}px)`,
  desktopUp: `(min-width: ${breakpoints.desktop}px)`,
} as const;

// === FUNCIONES HELPER ===

/**
 * Detecta el breakpoint actual
 */
export function getCurrentBreakpoint(): BreakpointName {
  if (typeof window === 'undefined') return 'desktop'; // SSR fallback
  
  const width = window.innerWidth;
  
  if (width <= breakpoints.mobileSm) return 'mobileSm';
  if (width <= breakpoints.mobile) return 'mobile';
  if (width < breakpoints.desktop) return 'tablet';
  if (width < breakpoints.desktopLg) return 'desktop';
  return 'desktopLg';
}

/**
 * Verifica si está en un breakpoint específico
 */
export function isBreakpoint(breakpoint: BreakpointName): boolean {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia(mediaQueries[breakpoint]).matches;
}

/**
 * Helpers rápidos para breakpoints comunes
 */
export const isMobile = () => isBreakpoint('mobile') || isBreakpoint('mobileSm');
export const isTablet = () => isBreakpoint('tablet');
export const isDesktop = () => isBreakpoint('desktop') || isBreakpoint('desktopLg');
export const isDesktopLg = () => isBreakpoint('desktopLg');

/**
 * Hook personalizado para React/Astro (si usas React)
 */
export function useBreakpoint() {
  if (typeof window === 'undefined') {
    return {
      current: 'desktop' as BreakpointName,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isDesktopLg: false,
    };
  }

  // En un hook real de React, aquí usarías useState y useEffect
  // Para Astro, esto es más bien una función helper
  const current = getCurrentBreakpoint();
  
  return {
    current,
    isMobile: current === 'mobile' || current === 'mobileSm',
    isTablet: current === 'tablet',
    isDesktop: current === 'desktop' || current === 'desktopLg',
    isDesktopLg: current === 'desktopLg',
  };
}

/**
 * Listener para cambios de breakpoint
 */
export function onBreakpointChange(callback: (breakpoint: BreakpointName) => void) {
  if (typeof window === 'undefined') return () => {};
  
  let currentBreakpoint = getCurrentBreakpoint();
  
  const handler = () => {
    const newBreakpoint = getCurrentBreakpoint();
    if (newBreakpoint !== currentBreakpoint) {
      currentBreakpoint = newBreakpoint;
      callback(newBreakpoint);
    }
  };
  
  window.addEventListener('resize', handler);
  
  // Retorna función de cleanup
  return () => window.removeEventListener('resize', handler);
}

/**
 * Verifica si el ancho es mayor que un breakpoint
 */
export function isAbove(breakpoint: BreakpointName): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth > breakpoints[breakpoint];
}

/**
 * Verifica si el ancho es menor que un breakpoint
 */
export function isBelow(breakpoint: BreakpointName): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < breakpoints[breakpoint];
}