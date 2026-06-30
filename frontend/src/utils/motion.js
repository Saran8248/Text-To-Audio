import React from 'react';

const animationProps = new Set([
  'animate',
  'exit',
  'initial',
  'layout',
  'layoutId',
  'transition',
  'variants',
  'whileFocus',
  'whileHover',
  'whileInView',
  'whileTap',
]);

const stripAnimationProps = (props) => {
  const cleanProps = {};

  Object.entries(props).forEach(([key, value]) => {
    if (!animationProps.has(key)) {
      cleanProps[key] = value;
    }
  });

  return cleanProps;
};

const motionCache = new Map();

export const motion = new Proxy({}, {
  get: (_, tag) => {
    if (!motionCache.has(tag)) {
      motionCache.set(tag, React.forwardRef((props, ref) => (
        React.createElement(tag, { ...stripAnimationProps(props), ref })
      )));
    }
    return motionCache.get(tag);
  },
});

export const AnimatePresence = ({ children }) => <>{children}</>;
