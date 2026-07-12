import { Router } from 'express';
import { validate } from '../../middleware/validate';
import * as ctrl from './settings.controller';
import {
  updateGeneralSchema,
  updateAiSchema,
  updateLimitsSchema,
  updateSecuritySchema,
  inviteTeamSchema,
  updateRoleSchema,
  idParamSchema,
  integrationKeyParamSchema,
  updateIntegrationSchema,
} from './settings.validators';

const router = Router();

// ===== Settings =====
router.get('/settings', ctrl.getSettings);
router.patch('/settings/general', validate(updateGeneralSchema, 'body'), ctrl.updateGeneral);
router.patch('/settings/ai', validate(updateAiSchema, 'body'), ctrl.updateAi);
router.patch('/settings/limits', validate(updateLimitsSchema, 'body'), ctrl.updateLimits);
router.patch('/settings/security', validate(updateSecuritySchema, 'body'), ctrl.updateSecurity);

// ===== Team =====
router.get('/team', ctrl.listTeam);
router.post('/team/invite', validate(inviteTeamSchema, 'body'), ctrl.inviteTeam);
router.patch(
  '/team/:id/role',
  validate(idParamSchema, 'params'),
  validate(updateRoleSchema, 'body'),
  ctrl.updateRole
);
router.delete('/team/:id', validate(idParamSchema, 'params'), ctrl.removeTeamMember);

// ===== Integrations =====
router.get('/integrations', ctrl.listIntegrations);
router.patch(
  '/integrations/:key',
  validate(integrationKeyParamSchema, 'params'),
  validate(updateIntegrationSchema, 'body'),
  ctrl.updateIntegration
);

export default router;
