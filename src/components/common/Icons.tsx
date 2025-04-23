import React from 'react';
import { Icon, IconProps } from '@chakra-ui/react';

export const SunIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3zm1-13h-2v3h2V2zm0 19h-2v3h2v-3zM5.64 7.05l-1.41 1.41 2.12 2.12 1.41-1.41-2.12-2.12zm12.72 12.72l-1.41 1.41 2.12 2.12 1.41-1.41-2.12-2.12zM2 13h3v-2H2v2zm19 0h3v-2h-3v2zM5.64 19.95l2.12-2.12-1.41-1.41-2.12 2.12 1.41 1.41zm12.72-12.72l2.12-2.12-1.41-1.41-2.12 2.12 1.41 1.41z"
    />
  </Icon>
);

export const WindIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M14.5 17c0 1.65-1.35 3-3 3s-3-1.35-3-3h2c0 .55.45 1 1 1s1-.45 1-1-.45-1-1-1H2v-2h9.5c1.65 0 3 1.35 3 3zM19 6.5C19 4.57 17.43 3 15.5 3S12 4.57 12 6.5h2c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S17.33 8 16.5 8H2v2h14.5C18.43 10 20 8.43 20 6.5H19zm-1 7c0-.83-.67-1.5-1.5-1.5S15 12.67 15 13.5h2c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S19.33 15 18.5 15H2v2h16.5c1.93 0 3.5-1.57 3.5-3.5s-1.57-3.5-3.5-3.5z"
    />
  </Icon>
);

export const DropIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
    />
  </Icon>
);
