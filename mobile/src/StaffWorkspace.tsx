import React from 'react';
import SecureWebsite from './SecureWebsite';

export default function StaffWorkspace({ onClose }: { onClose: () => void }) {
  return <SecureWebsite mode="staff" onClose={onClose} />;
}
