polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  resource: Ember.computed.alias('block.data.details.result.resource'),
  timezone: Ember.computed('Intl', function () {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }),
  /**
   * details.result.operating_system can be an empty object so we need a check to not show the OS Details title
   * in the template if this is the case.
   */
  hasOperatingSystemData: Ember.computed('resource.operating_system', function () {
    const os = this.get('resource.operating_system');
    if (os && typeof os === 'object') {
      return Object.keys(os).length > 0;
    }
    return false;
  }),
  labels: Ember.computed('resource.services', function () {
    const services = this.get('resource.services');
    const labels = [];
    services.forEach((service) => {
      if (Array.isArray(service.labels)) {
        service.labels.forEach((label) => {
          labels.push(label.value);
        });
      }
    });
    return labels;
  })
});
