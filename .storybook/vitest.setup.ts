import * as a11yAddonAnnotations from '@storybook/addon-a11y/preview';
import { setProjectAnnotations } from '@storybook/nextjs-vite';
import * as projectAnnotations from './preview';

// Apply the Storybook configuration (decorators, a11y checks) to story tests.
setProjectAnnotations([a11yAddonAnnotations, projectAnnotations]);
