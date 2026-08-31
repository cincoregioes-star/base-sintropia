(() => {
  'use strict';

  const ROLE_PERMISSIONS = Object.freeze({
    orientador: [
      'participant.read.scoped', 'participant.create', 'participant.update.scoped',
      'group.read.scoped', 'attendance.read.scoped', 'attendance.write.scoped',
      'workshop.read', 'workshop.create', 'referral.read.scoped', 'referral.create',
      'dashboard.read.scoped', 'report.generate.scoped', 'sinti.use'
    ],
    tecnico: [
      'participant.read.unit', 'participant.update.unit', 'group.read.unit',
      'attendance.read.unit', 'workshop.read', 'referral.read.unit', 'referral.update.unit',
      'dashboard.read.unit', 'report.generate.unit', 'sinti.use'
    ],
    coordenador: [
      'participant.read.unit', 'participant.update.unit', 'group.read.unit', 'group.manage.unit',
      'attendance.read.unit', 'workshop.read', 'workshop.manage.unit', 'referral.read.unit',
      'referral.update.unit', 'dashboard.read.unit', 'dashboard.create.unit',
      'report.generate.unit', 'risk.read.unit', 'decision.manage.unit', 'dataquality.read.unit', 'rule.manage.unit', 'sinti.use'
    ],
    gestor: [
      'participant.read.aggregate', 'group.read.organization', 'attendance.read.organization',
      'workshop.read.organization', 'referral.read.organization', 'dashboard.read.organization',
      'dashboard.create.organization', 'report.generate.organization', 'risk.read.organization',
      'decision.manage.organization', 'dataquality.read.organization', 'rule.manage.organization', 'sinti.use'
    ],
    auditor: [
      'audit.read.organization', 'dataquality.read.organization', 'risk.read.organization',
      'report.read.organization'
    ],
    administrador: ['*']
  });

  function list(role) {
    return ROLE_PERMISSIONS[role] ? [...ROLE_PERMISSIONS[role]] : [];
  }

  function can(role, permission) {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes('*') || permissions.includes(permission);
  }

  window.SintropiaPermissions = Object.freeze({ ROLE_PERMISSIONS, list, can });
})();
