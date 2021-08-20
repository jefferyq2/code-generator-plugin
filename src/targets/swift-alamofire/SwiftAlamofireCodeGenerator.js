// Generated by CoffeeScript 1.12.7
const Mustache = require("mustache");
const URI = require("URIjs");

const addslashes = function (str) {
  return ("" + str).replace(/[\\"]/g, "\\$&").replace(/[\n\r\f]/gm, "\\n");
};

const slugify = function (str) {
  var l, m, re;
  re = /([a-zA-Z0-9])([a-zA-Z0-9]*)/g;
  l = [];
  while ((m = re.exec(str))) {
    if (m) {
      l.push(m[1].toUpperCase() + m[2].toLowerCase());
    }
  }
  return l.join("");
};

const urlTransform = function (request) {
  var name, url_params, url_params_object, value;
  url_params_object = (function () {
    var _uri;
    _uri = URI(request.url);
    return _uri.search(true);
  })();
  url_params = (function () {
    var results;
    results = [];
    for (name in url_params_object) {
      value = url_params_object[name];
      results.push({
        name: addslashes(name),
        value: addslashes(value),
      });
    }
    return results;
  })();
  return {
    fullpath: request.url,
    base: addslashes(
      (function () {
        var _uri;
        _uri = URI(request.url);
        _uri.search("");
        return _uri;
      })()
    ),
    params: url_params,
    has_params: url_params.length > 0,
  };
};

const headersTransform = function (request) {
  var hasBasicAuth, header_name, header_value, headers;
  headers = request.headers;
  if (request.httpBasicAuth) {
    hasBasicAuth = true;
  }
  return {
    has_headers: Object.keys(headers).length > 0,
    header_list: (function () {
      var results;
      results = [];
      for (header_name in headers) {
        header_value = headers[header_name];
        if (header_name.toLowerCase() !== "authorization" || !hasBasicAuth) {
          results.push({
            header_name: addslashes(header_name),
            header_value: addslashes(header_value),
          });
        }
      }
      return results;
    })(),
  };
};
const bodyTransform = function (request) {
  var json_body, multipart_body, name, raw_body, url_encoded_body, value;
  json_body = request.jsonBody;
  if (json_body) {
    return {
      has_json_body: true,
      json_body_object: json_body_object(json_body, 1),
    };
  }
  url_encoded_body = request.urlEncodedBody;
  if (url_encoded_body) {
    return {
      has_url_encoded_body: true,
      url_encoded_body: (function () {
        var results;
        results = [];
        for (name in url_encoded_body) {
          value = url_encoded_body[name];
          results.push({
            name: addslashes(name),
            value: addslashes(value),
          });
        }
        return results;
      })(),
    };
  }
  multipart_body = request.multipartBody;
  if (multipart_body) {
    return {
      has_multipart_body: true,
      multipart_body: (function () {
        var results;
        results = [];
        for (name in multipart_body) {
          value = multipart_body[name];
          results.push({
            name: addslashes(name),
            value: addslashes(value),
          });
        }
        return results;
      })(),
    };
  }
  raw_body = request.body;
  if (raw_body) {
    if (raw_body.length < 10000) {
      return {
        has_raw_body: true,
        has_short_body: true,
        short_body: addslashes(raw_body),
      };
    } else {
      return {
        has_raw_body: true,
        has_long_body: true,
      };
    }
  }
};
const json_body_object = function (object, indent) {
  var indent_str, indent_str_children, key, s, value;
  if (indent == null) {
    indent = 0;
  }
  if (object === null) {
    s = "NSNull()";
  } else if (typeof object === "string") {
    s = '"' + addslashes(object) + '"';
  } else if (typeof object === "number") {
    s = "" + object;
  } else if (typeof object === "boolean") {
    s = "" + (object ? "true" : "false");
  } else if (typeof object === "object") {
    indent_str = Array(indent + 1).join("    ");
    indent_str_children = Array(indent + 2).join("    ");
    if (object.length != null) {
      s =
        "[\n" +
        function () {
          var i, len, results;
          results = [];
          for (i = 0, len = object.length; i < len; i++) {
            value = object[i];
            results.push(
              "" + indent_str_children + json_body_object(value, indent + 1)
            );
          }
          return results;
        }
          .call(this)
          .join(",\n") +
        ("\n" + indent_str + "]");
    } else {
      s =
        "[\n" +
        function () {
          var results;
          results = [];
          for (key in object) {
            value = object[key];
            results.push(
              indent_str_children +
                '"' +
                addslashes(key) +
                '": ' +
                json_body_object(value, indent + 1)
            );
          }
          return results;
        }
          .call(this)
          .join(",\n") +
        ("\n" + indent_str + "]");
    }
  }
  if (indent <= 1) {
    s = "let body: [String : Any] = " + s;
  }
  return s;
};

exports.generate = function (request) {
  var method, view;
  method = request.method.toUpperCase();
  view = {
    request: request,
    method: method.toLowerCase(),
    url: urlTransform(request),
    headers: headersTransform(request),
    body: bodyTransform(request),
    timeout: request.timeout ? request.timeout / 1000 : null,
    codeSlug: slugify(request.name),
    httpBasicAuth: request.httpBasicAuth,
  };

  if (
    view.url.has_params &&
    (method === "GET" || method === "HEAD" || method === "DELETE")
  ) {
    view["has_params_to_encode"] = true;
  }
  return Mustache.render(template, view);
};

exports.metadata = () => {
  return {
    name: "Swift Generator",
    fileExtension: "swift",
    title: "Swift (Alamofire 4)",
    mime: "swift",
    identifier: "com.proxyman.plugin.SwiftAlamofireGenerator",
    author: "Paw and Proxyman",
  };
};

// Inlcude a template because we could not build require("fs") in webpack

const template = 
`func send{{{codeSlug}}}Request() {
  /**
   {{{request.name}}}
   {{{method}}} {{{url.base}}}
   */

  {{! ----- Timeout ----- }}
  {{#timeout}}
  // Add timeout
  let configuration = NSURLSessionConfiguration.defaultSessionConfiguration()
  configuration.timeoutIntervalForRequest = {{{timeout}}}
  let manager = Alamofire.SessionManager(configuration: configuration)

  {{/timeout}}
  {{! ----- Headers ----- }}
  {{#headers.has_headers}}
  // Add Headers
  let headers = [
  {{#headers.header_list}}
      "{{{header_name}}}": "{{{header_value}}}",
  {{/headers.header_list}}
  ]

  {{/headers.has_headers}}
  {{! ----- URL Parameters ----- }}
  {{#has_params_to_encode}}
  // Add URL parameters
  let urlParams = [
  {{#url.params}}
      "{{{name}}}": "{{{value}}}",
  {{/url.params}}
  ]

  {{/has_params_to_encode}}
  {{! ----- Form URL-Encoded Body ----- }}
  {{#body.has_url_encoded_body}}
  // Form URL-Encoded Body
  let body = [
  {{#body.url_encoded_body}}
      "{{{name}}}": "{{{value}}}",
  {{/body.url_encoded_body}}
  ]

  {{/body.has_url_encoded_body}}
  {{! ----- JSON Body ----- }}
  {{#body.has_json_body}}
  // JSON Body
  {{{body.json_body_object}}}

  {{/body.has_json_body}}
  {{! ----- Request ----- }}
  {{^body.has_multipart_body}}
  {{#body.has_raw_body}}
  // Custom Body Encoding
  struct RawDataEncoding: ParameterEncoding {
      public static var \`default\`: RawDataEncoding { return RawDataEncoding() }
      public func encode(_ urlRequest: URLRequestConvertible, with parameters: Parameters?) throws -> URLRequest {
          var request = try urlRequest.asURLRequest()
          {{#body.has_short_body}}
          request.httpBody = "{{{body.short_body}}}".data(using: String.Encoding.utf8, allowLossyConversion: false)
          {{/body.has_short_body}}
          {{^body.has_short_body}}
          request.httpBody = nil // set your body data here
          {{/body.has_short_body}}
          return request
      }
  }
  
  {{/body.has_raw_body}}
  // Fetch Request
  {{#timeout}}manager{{/timeout}}{{^timeout}}Alamofire{{/timeout}}.request({{#has_params_to_encode}}"{{{url.base}}}"{{/has_params_to_encode}}{{^has_params_to_encode}}"{{{url.fullpath}}}"{{/has_params_to_encode}}, method: .{{{method}}}{{#body}}{{^body.has_raw_body}}, parameters: body{{/body.has_raw_body}}{{/body}}{{#body.has_raw_body}}, encoding: RawDataEncoding.default{{/body.has_raw_body}}{{^body}}{{#has_params_to_encode}}, parameters: urlParams{{/has_params_to_encode}}{{/body}}{{#body.has_json_body}}, encoding: JSONEncoding.default{{/body.has_json_body}}{{#body.has_url_encoded_body}}, encoding: URLEncoding.default{{/body.has_url_encoded_body}}{{#headers.has_headers}}, headers: headers{{/headers.has_headers}})
  {{#httpBasicAuth}}
      .authenticate(user: "{{httpBasicAuth.username}}", password: "{{httpBasicAuth.password}}")
  {{/httpBasicAuth}}
      .validate(statusCode: 200..<300)
      .responseJSON { response in
          if (response.result.error == nil) {
              debugPrint("HTTP Response Body: \(response.data)")
          }
          else {
              debugPrint("HTTP Request failed: \(response.result.error)")
          }
      }
  {{/body.has_multipart_body}}
  {{! ----- Upload (Multipart) ----- }}
  {{#body.has_multipart_body}}
  // Fetch Request
  {{#timeout}}manager{{/timeout}}{{^timeout}}Alamofire{{/timeout}}.upload(multipartFormData: { multipartFormData in
      {{#body.multipart_body}}
          multipartFormData.append("{{{value}}}".data(using: String.Encoding.utf8, allowLossyConversion: false)!, withName :"{{{name}}}")
      {{/body.multipart_body}}
      }, usingThreshold: UInt64.init(), to: "{{{url.fullpath}}}", method: .{{{method}}}{{#headers.has_headers}}, headers: headers{{/headers.has_headers}}, encodingCompletion: { encodingResult in
          switch encodingResult {
          case .success(let upload, _, _):
              upload.responseJSON { response in
                  debugPrint(response)
              }
          case .failure(let encodingError):
              print(encodingError)
          }
      })
  {{/body.has_multipart_body}}
}
`;
