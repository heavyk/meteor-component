
Meteor.__COMPONENT_PRESENT = require('component/package.json').version;
Meteor.__COMPONENT_BUILDER_PRESENT = require('component-builder/package.json').version;

Tinytest.add("component - presence", function(test) {
  test.isTrue(Meteor.__COMPONENT_PRESENT === '0.13.0');
  test.isTrue(Meteor.__COMPONENT_BUILDER_PRESENT === '0.6.3');
});

