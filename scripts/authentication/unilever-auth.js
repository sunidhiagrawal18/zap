var HttpSender = Java.type('org.parosproxy.paros.network.HttpSender');
var ScriptVars = Java.type('org.zaproxy.zap.extension.script.ScriptVars');
var Pattern = Java.type('java.util.regex.Pattern');

function authenticate(helper, paramsValues, credentials) {
    // Step 1: Fetch login page to extract CSRF token
    var loginPageUrl = "https://dcodept.unilever.com/sso-dev/login";
    var msg = helper.prepareMessage();
    msg.setRequestHeader("GET " + loginPageUrl + " HTTP/1.1");
    helper.sendAndReceive(msg);
    
    // Step 2: Extract CSRF token (adjust regex if needed)
    var responseBody = msg.getResponseBody().toString();
    var csrfPattern = Pattern.compile('name="_csrf" value="([^"]+)"');
    var matcher = csrfPattern.matcher(responseBody);
    if (!matcher.find()) {
        print("❌ Failed to extract CSRF token!");
        return null;
    }
    var csrfToken = matcher.group(1);
    ScriptVars.setGlobalVar("csrf-token", csrfToken);
    
    // Step 3: Submit login with credentials + CSRF token
    var loginUrl = "https://dcodept.unilever.com/sso-dev/login";
    var postData = "_csrf=" + encodeURIComponent(csrfToken) + 
                  "&username=" + encodeURIComponent(credentials.getParam("username")) + 
                  "&password=" + encodeURIComponent(credentials.getParam("password"));
    
    var loginMsg = helper.prepareMessage();
    loginMsg.setRequestHeader("POST " + loginUrl + " HTTP/1.1");
    loginMsg.setRequestBody(postData);
    loginMsg.getRequestHeader().setHeader("Content-Type", "application/x-www-form-urlencoded");
    loginMsg.getRequestHeader().setHeader("Referer", loginPageUrl);
    helper.sendAndReceive(loginMsg);
    
    // Step 4: Verify successful login (302 redirect)
    if (loginMsg.getResponseHeader().getStatusCode() != 302 || 
        !loginMsg.getResponseHeader().getHeader("Location").contains("multiple-organization")) {
        print("❌ Login failed! Check credentials.");
        return null;
    }
    
    print("✅ Login successful!");
    return loginMsg;
}

function getRequiredParamsNames() { return []; }
function getOptionalParamsNames() { return []; }
