polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  showAll: false,
  initialResultSizeToShow: 5,
  numAdditionalResults: Ember.computed('details.results.length', 'initialResultSizeToShow', function () {
    return this.get('details.results.length') - this.get('initialResultSizeToShow');
  }),
  pagedResults: Ember.computed('details.results', 'showAll', 'initialResultSizeToShow', function () {
    if (this.get('showAll')) {
      return this.get('details.results');
    }
    return this.get('details.results').slice(0, this.get('initialResultSizeToShow'));
  }),
  actions: {
    toggleShowAll: function () {
      this.toggleProperty('showAll');
    }
  }
});
