var ScriptVars = Java.type('org.zaproxy.zap.extension.script.ScriptVars');
var Cookie = Java.type('org.parosproxy.paros.network.Cookie');

function beforeSend(msg, initiator, helper) {
    // Inject session cookies into every request
    var jsessionId = ScriptVars.getGlobalVar("JSESSIONID");
    var sessionId = ScriptVars.getGlobalVar("SESSIONID");
    
    if (jsessionId) {
        msg.getRequestHeader().setCookie(new Cookie("JSESSIONID", jsessionId, "/", "dcodept.unilever.com", -1, false, true, true));
    }
    if (sessionId) {
        msg.getRequestHeader().setCookie(new Cookie("SESSIONID", sessionId, "/", "unilever.com", -1, true, true, true));
    }
}

function sessionEstablished(session, helper) {
    // Store session cookies after login
    var cookies = session.getHttpMessage().getResponseHeader().getHttpCookies();
    for (var i = 0; i < cookies.size(); i++) {
        var cookie = cookies.get(i);
        if (cookie.getName() === "JSESSIONID" || cookie.getName() === "SESSIONID") {
            ScriptVars.setGlobalVar(cookie.getName(), cookie.getValue());
        }
    }
}

function responseReceived(msg, initiator, helper) {
    // Detect session expiry (401/403)
    if (msg.getResponseHeader().getStatusCode() === 401 || msg.getResponseHeader().getStatusCode() === 403) {
        print("⚠️ Session expired! Re-authenticate if needed.");
    }
}
