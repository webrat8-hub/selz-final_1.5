export const ROLES = {
  TRIAL: { id: 'trial', permanent: false },
  MEMBER: { id: 'member', permanent: false },
  FULL_UP: { id: 'full_up', permanent: true },
  RESELLER: { id: 'reseller', permanent: true },
};

export const checkAccess = (user: any) => {
  if (!user) return { allowed: false, message: "User tidak ditemukan" };
  if (user.locked) return { allowed: false, message: "Akun Terkunci (Hubungi Admin)" };
  const roleData = Object.values(ROLES).find(r => r.id === user.role);
  if (roleData?.permanent) return { allowed: true };
  if (user.expiry_date && Date.now() > user.expiry_date) return { allowed: false, message: "Akun Expired" };
  return { allowed: true };
};
