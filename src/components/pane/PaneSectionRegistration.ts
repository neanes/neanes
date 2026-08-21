import type { InjectionKey } from 'vue';

export type PaneSectionRegistration = {
  registerSection: (value: string) => void;
  unregisterSection: (value: string) => void;
};

export const paneSectionRegistrationKey: InjectionKey<PaneSectionRegistration> =
  Symbol('paneSectionRegistration');
