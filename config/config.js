module.exports = {
  /**
   * Name of the integration which is displayed in the Polarity integrations user interface
   *
   * @type String
   * @required
   */
  name: 'Censys',
  /**
   * The acronym that appears in the notification window when information from this integration
   * is displayed.  Note that the acronym is included as part of each "tag" in the summary information
   * for the integration.  As a result, it is best to keep it to 4 or less characters.  The casing used
   * here will be carried forward into the notification window.
   *
   * @type String
   * @required
   */
  acronym: 'CSYS',
  onDemandOnly: false,
  defaultColor: 'light-pink',
  /**
   * Description for this integration which is displayed in the Polarity integrations user interface
   *
   * @type String
   * @optional
   */
  description:
    'Censys reduces your Internet attack surface by continually discovering unknown assets and helping remediate Internet facing risks.',
  entityTypes: ['IPv4'],
  /**
   * Provide custom component logic and template for rendering the integration details block.  If you do not
   * provide a custom template and/or component then the integration will display data as a table of key value
   * pairs.
   *
   * @type Object
   * @optional
   */
  styles: ['./styles/style.less'],
  block: {
    component: {
      file: './components/block.js'
    },
    template: {
      file: './templates/block.hbs'
    }
  },
  request: {
    // Provide the path to your certFile. Leave an empty string to ignore this option.
    // Relative paths are relative to the integration's root directory
    cert: '',
    // Provide the path to your private key. Leave an empty string to ignore this option.
    // Relative paths are relative to the integration's root directory
    key: '',
    // Provide the key passphrase if required.  Leave an empty string to ignore this option.
    // Relative paths are relative to the integration's root directory
    passphrase: '',
    // Provide the Certificate Authority. Leave an empty string to ignore this option.
    // Relative paths are relative to the integration's root directory
    ca: '',
    // An HTTP proxy to be used. Supports proxy Auth with Basic Auth, identical to support for
    // the url parameter (by embedding the auth info in the uri)
    proxy: ""
  },
  logging: {
    level: 'info' //trace, debug, info, warn, error, fatal
  },
  options: [
    {
      key: "url",
      name: "Base URL for the Censys REST API",
      description:
        "The base URL for the Censys REST API including the schema (i.e., https://). Defaults to `https://search.censys.io/api`",
      type: "text",
      default: "https://search.censys.io/api",
      userCanEdit: false,
      adminOnly: false
    },
    {
      key: 'apiId',
      name: 'API ID',
      description: 'Valid Censys API ID',
      default: '',
      type: 'text',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'apiSecret',
      name: 'API Secret',
      description: 'Valid Censys API Secret corresponding to the provided ID',
      default: '',
      type: 'password',
      userCanEdit: true,
      adminOnly: false
    }
  ]
};
