# component for meteor

you will need to do some trickery for this to work... that is until they have npm package dependencies built into meteor (it's coming! eventually...) for now, try this:

	npm install component component-builder
	cd node_modules/component && npm link && cd ../..
	cd node_modules/component-builder && npm link && cd ../..

# Notes

due to a bug with multiple components depending on the same component (component-emitter for example), with the stock version of component, you might get hangs...

I have [made a pull request](https://github.com/component/component/pull/276), so you will have to wait, or you can optionally check out my [repo here](https://github.com/heavyk/component)