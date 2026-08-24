import type { NavigateFunction } from 'react-router-dom';

export function redirectToSignup(navigate: NavigateFunction) {
  navigate('/auth?tab=signup');
}