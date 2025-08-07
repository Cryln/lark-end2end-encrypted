

export function getAppId(): string {
    const currentUrl = location.href.split("#")[0];
    const triggerContext = new URL(currentUrl).searchParams.get("trigger_context");
    if (!triggerContext) {
        throw new Error("trigger_context不存在");
    }
    const triggerContextJson = JSON.parse(triggerContext);
    const appId = triggerContextJson.appId;
    if (!appId) {
        throw new Error("trigger_context.appId不存在");
    }
    return appId;
}
