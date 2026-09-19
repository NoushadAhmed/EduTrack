import React from 'react';
import { SpinnerWrap, SpinnerRing } from './UI';

const Loader = () => (
  <SpinnerWrap style={{ minHeight: '60vh' }}>
    <SpinnerRing />
  </SpinnerWrap>
);

export default Loader;
