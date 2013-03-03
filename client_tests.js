

Tinytest.add("component - presence", function(test) {
  test.isTrue(typeof component === 'object');
  test.isTrue(typeof component.require === 'function');
});

