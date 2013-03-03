# component for meteor

you will need to do some trickery for this to work... that is until they have npm package dependencies built into meteor (it's coming! eventually...) for now, try this:

I am working on a Npm dependency module for meteor... not ready yet though...

# Notes

due to a bug with multiple components depending on the same component (component-emitter for example), with the stock version of component, you might get hangs...

I have [made a pull request](https://github.com/component/component/pull/276), so you will have to wait, or you can optionally check out my [repo here](https://github.com/heavyk/component)

# Future

 * add a lock file. when more than one instance of meteor is spawned... things get pretty crazy...
