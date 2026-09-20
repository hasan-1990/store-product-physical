import * as React from 'react';
import { render } from '@react-email/render';
import { PasswordResetEmail } from './PasswordResetEmail';

export function renderPasswordResetEmail(props: { email: string; resetLink: string }) {
  return render(<PasswordResetEmail {...props} />, { pretty: true });
}

export default renderPasswordResetEmail;
