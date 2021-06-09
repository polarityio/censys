polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  showAll: false,
  initialResultSizeToShow: 5,
  additionalResults: Ember.computed('block.data.details.results', 'showAll', 'initialResultSizeToShow', function(){

  }),
  pagedResults: Ember.computed('block.data.details.results', 'showAll', 'initialResultSizeToShow', function () {
    if (this.get('showAll')) {
      return this.get('block.data.details.results');
    }
    return this.get('block.data.details.results').slice(0, this.get('initialResultSizeToShow'));
  }),
  actions: {
    toggleShowAll: function(){
      this.toggleProperty('showAll');
    }
  }
});
