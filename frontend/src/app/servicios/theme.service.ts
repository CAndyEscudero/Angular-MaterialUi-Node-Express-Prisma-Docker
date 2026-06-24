import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private renderer: Renderer2;
  private readonly STORAGE_KEY = 'theme';
  private dark = false;

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.dark = localStorage.getItem(this.STORAGE_KEY) === 'dark';
    this.aplicarTema();
  }

  isDark(): boolean {
    return this.dark;
  }

  toggleTheme(): void {
    this.dark = !this.dark;
    localStorage.setItem(this.STORAGE_KEY, this.dark ? 'dark' : 'light');
    this.aplicarTema();
  }

  private aplicarTema(): void {
    if (this.dark) {
      this.renderer.setAttribute(document.documentElement, 'data-theme', 'dark');
    } else {
      this.renderer.removeAttribute(document.documentElement, 'data-theme');
    }
  }
}
