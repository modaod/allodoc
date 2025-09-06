import { createParamDecorator, ExecutionContext, Logger } from '@nestjs/common';

export const CurrentOrganization = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    const logger = new Logger('CurrentOrganization');
    try {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user;
        const organizationId = user?.organizationId || request.organizationId;

        logger.debug(
            `CurrentOrganization: user.organizationId=${user?.organizationId}, request.organizationId=${request.organizationId}, returning: ${organizationId}`,
        );

        if (!organizationId) {
            logger.warn('CurrentOrganization: No organization ID found');
        }

        return organizationId;
    } catch (error) {
        logger.error(`CurrentOrganization decorator error: ${error.message}`, error.stack);
        throw error;
    }
});
