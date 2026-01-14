// TypeScript declarations for model-viewer web component
import 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          alt?: string;
          'auto-rotate'?: boolean | string;
          'auto-rotate-delay'?: string;
          'rotation-per-second'?: string;
          'camera-controls'?: string | boolean;
          'interaction-policy'?: string;
          'disable-zoom'?: boolean;
          'disable-pan'?: boolean;
          'disable-tap'?: boolean;
          ar?: string | boolean;
          'shadow-intensity'?: string;
          exposure?: string;
          'environment-image'?: string;
          'camera-orbit'?: string;
          'field-of-view'?: string;
          'min-camera-orbit'?: string;
          'max-camera-orbit'?: string;
        },
        HTMLElement
      >;
    }
  }
}

export {};
