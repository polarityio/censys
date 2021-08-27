polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  /**
   * details.result.operating_system can be an empty object so we need a check to not show the OS Details title
   * in the template if this is the case.
   */
  hasOperatingSystemData: Ember.computed('details.result.operating_system', function () {
    const os = this.get('details.result.operating_system');
    if (os && typeof os === 'object') {
      return Object.keys(os).length > 0;
    }
    return false;
  })
});
