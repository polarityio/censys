'use strict';

const request = require('postman-request');
const config = require('./config/config');
const async = require('async');
const fs = require('fs');
const get = require('lodash.get');
const { version: packageVersion } = require('package.json');

let Logger;
let requestWithDefaults;

const MAX_PARALLEL_LOOKUPS = 10;
const MAX_SERVICE_TAGS = 3;
const USER_AGENT = `censys-polarity-integration-v${packageVersion}`;
function startup(logger) {
  let defaults = {};

  Logger = logger;

  const { cert, key, passphrase, ca, proxy, rejectUnauthorized } = config.request;

  if (typeof cert === 'string' && cert.length > 0) {
    defaults.cert = fs.readFileSync(cert);
  }

  if (typeof key === 'string' && key.length > 0) {
    defaults.key = fs.readFileSync(key);
  }

  if (typeof passphrase === 'string' && passphrase.length > 0) {
    defaults.passphrase = passphrase;
  }

  if (typeof ca === 'string' && ca.length > 0) {
    defaults.ca = fs.readFileSync(ca);
  }

  if (typeof proxy === 'string' && proxy.length > 0) {
    defaults.proxy = proxy;
  }

  if (typeof rejectUnauthorized === 'boolean') {
    defaults.rejectUnauthorized = rejectUnauthorized;
  }

  requestWithDefaults = request.defaults(defaults);
}

function doLookup(entities, options, cb) {
  let lookupResults = [];
  let tasks = [];

  Logger.debug(entities);
  entities.forEach((entity) => {
    let requestOptions = {
      method: 'GET',
      uri: `${options.url}/v2/hosts/${entity.value}`,
      auth: {
        user: options.apiId,
        pass: options.apiSecret
      },
      headers: {
        'User-Agent': USER_AGENT
      },
      json: true
    };

    Logger.trace({ requestOptions }, 'Request Options');

    tasks.push(function (done) {
      requestWithDefaults(requestOptions, function (error, res, body) {
        let processedResult = handleRestError(error, entity, res, body);

        if (processedResult.error) {
          done(processedResult);
          return;
        }

        done(null, processedResult);
      });
    });
  });

  async.parallelLimit(tasks, MAX_PARALLEL_LOOKUPS, (err, results) => {
    if (err) {
      Logger.error({ err: err }, 'Error');
      cb(err);
      return;
    }

    results.forEach((result) => {
      if (result.body === null || result.body.length === 0) {
        lookupResults.push({
          entity: result.entity,
          data: null
        });
      } else {
        lookupResults.push({
          entity: result.entity,
          data: {
            summary: getTags(result.body),
            details: result.body
          }
        });
      }
    });

    Logger.debug({ lookupResults }, 'Results');
    cb(null, lookupResults);
  });
}

function handleRestError(error, entity, res, body) {
  if (error) {
    return {
      error: error,
      detail: 'HTTP Request Error'
    };
  }

  Logger.trace({ body, status: res.statusCode });

  if (res.statusCode === 200 && body.status === 'OK') {
    // we got data! (could still be a miss however)
    if (hasResult(body)) {
      return {
        entity,
        body
      };
    } else {
      return {
        entity,
        body: null
      };
    }
  } else {
    return {
      statusCode: res.statusCode,
      body, // add the full body since we have no idea at this point what they are giving us
      error: true,
      detail: body.error ? body.error : 'An unknown error occurred.'
    };
  }
}

function hasResult(body) {
  return (
    get(body, 'result.services', []).length > 0 ||
    Object.keys(get(body, 'result.location', {})).length > 0 ||
    Object.keys(get(body, 'result.operating_system', {})).length > 0
  );
}

function getTags(body) {
  const tags = [];
  const services = get(body, 'result.services', []);
  for (let i = 0; i < MAX_SERVICE_TAGS && i < services.length; i++) {
    const service = services[i];
    tags.push(`${service.port}/${service.service_name}`);
  }
  if (services.length > MAX_SERVICE_TAGS) {
    tags.push(`+${services.length - MAX_SERVICE_TAGS} more services`);
  }
  tags.push(`Country: ${get(body, 'result.location.country', 'Not Available')}`);
  tags.push(`AS Name: ${get(body, 'result.autonomous_system.name', 'Not Available')}`);
  return tags;
}

function validateOption(errors, options, optionName, errMessage) {
  if (
    typeof options[optionName].value !== 'string' ||
    (typeof options[optionName].value === 'string' && options[optionName].value.length === 0)
  ) {
    errors.push({
      key: optionName,
      message: errMessage
    });
  }
}

function validateOptions(options, callback) {
  let errors = [];

  validateOption(errors, options, 'url', 'You must provide a valid URL.');
  validateOption(errors, options, 'apiId', 'You must provide a valid API ID.');
  validateOption(errors, options, 'apiSecret', 'You must provide a valid API Secret.');

  callback(null, errors);
}

module.exports = {
  doLookup,
  validateOptions,
  startup
};
