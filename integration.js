'use strict';

const request = require('request');
const config = require('./config/config');
const async = require('async');
const fs = require('fs');

let Logger;
let requestWithDefaults;

const MAX_PARALLEL_LOOKUPS = 10;
const MAX_RESULTS_TO_RETURN = 25;

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
    let query;

    if (options.dataset.value === 'ipv4' && entity.isIPv4) {
      query = 'ip:' + entity.value;
    } else if (options.dataset.value === 'domain' && entity.isDomain) {
      query = 'domain:' + entity.value;
    } else {
      query = entity.value;
    }

    let requestOptions = {
      method: 'POST',
      uri: `${options.url}/search/${options.dataset.value}`,
      auth: {
        user: options.apiId,
        pass: options.apiSecret
      },
      body: {
        query,
        flatten: false
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
      Logger.trace({ result: result }, 'results');

      // result.body should be a POJO
      // result.body should contain a `results` array with one or more objects in it
      if (
        typeof result.body !== 'object' ||
        Array.isArray(result.body) ||
        result.body === null ||
        !result.body.results ||
        (Array.isArray(result.body.results) && result.body.results.length === 0)
      ) {
        lookupResults.push({
          entity: result.entity,
          data: null
        });
      } else {
        let count = result.body.metadata.count ? result.body.metadata.count : result.body.results.length;
        // censys can return up to 100 results in a single page which is too much for the overlay window so we
        // only return up to MAX_RESULTS_TO_RETURN
        result.body.results = result.body.results.slice(0, MAX_RESULTS_TO_RETURN);

        lookupResults.push({
          entity: result.entity,
          data: {
            summary: [`Result Count: ${count}`],
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
  let result;

  if (error) {
    return {
      error: error,
      detail: 'HTTP Request Error'
    };
  }

  Logger.trace({ body, status: res.statusCode });

  if (res.statusCode === 200 && body.status === 'ok') {
    // we got data! (could still be a miss however)
    result = {
      entity: entity,
      body: body
    };
  } else {
    result = {
      statusCode: res.statusCode,
      body, // add the full body since we have no idea at this point what they are giving us
      detail: body.error ? body.error : 'An unknown error occurred.'
    };
  }

  return result;
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
  doLookup: doLookup,
  validateOptions: validateOptions,
  startup: startup
};
