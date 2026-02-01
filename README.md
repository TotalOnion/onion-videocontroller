# onion-videocontroller

Multi format video player with optional modal pop up.
The videocontroller houses multiple video implementations as modules which it calls upon depending on the type of video the user wishes to play. This way all the necessary code plus lazyloading optimisations can be implemented separately for each video type.
Given that the videocontroller builds a dictionary of all the video containers and video triggers that have been passed to it, it can do things like stop currently playing videos when a new video is started, regardless of which type of video they might be.

## Install via npm or yarn with:

`npm install @pernod-ricard-global-cms/onion-videocontroller`
or
`yarn add @pernod-ricard-global-cms/onion-videocontroller`

## Import the module in your js file with:

`import onion-videocontroller from '@pernod-ricard-global-cms/onion-videocontroller';`

Instantiate the class in your js file and pass a reference to an html element that is a parent of the video container.
In a typical cbl block js file this would be the block element, so it might look something like this.

`const videoController = new onion-videocontroller(block);`

## HTML/Twig

To get the most functionality out of the box, this package should be installed along with the the cbl component library.

https://github.com/Chivas-Brothers/cbl-component-library

If you install the fields: video from the component library you will receive 2 twig files with the standardized selection of variables already wired up to attributes in the html. By default they will be copied to the views/components folder but you can choose to not run the install command for the video fields and copy the twigs to wherever you would prefer.

`video-component.twig`
`video-trigger-button.twig`

You can then call the twig snippets with an include like this.

`<section>`

    {{ include("components/video-trigger-button.twig", {fields : fields, block : block, blockClassName: blockClassName}, with_context = false) }}

    {{ include("components/video-component.twig", {fields : fields, block : block, blockClassName: blockClassName}, with_context = false) }}

`</section>`

The snippets don't need to be positioned in any special relationship to each other except that you need to put them somewhere within the container you intend to pass to the video controller.

The included twig files will receive the acf fields that are being passed to the block. Although it can work fine as it is, it is advisable to pass another variable with the classname of your block which will make handling the styling a little easier. You can do this by assigning the string of the classname to the blockClassName twig variable.
eg:

`<section>`

    {% set blockClassName = 'simple-video-block' %}

    {{ include("components/video-trigger-button.twig", {fields : fields, block : block, blockClassName: blockClassName}, with_context = false) }}

    {{ include("components/video-component.twig", {fields : fields, block : block, blockClassName: blockClassName}, with_context = false) }}

`</section>`

## Styling

You can choose to do all the styling yourself in which case there is nothing left to import. However, there are some basic styles exported as mixins which are very easy to override and can get you to a workable result very quickly. You can import them directly from the package folder into your scss file and then include the mixin in the scope of your parent block class.

`@use 'NodeModules/@pernod-ricard-global-cms/onion-videocontroller/vc-styles';`

`.parent-block-class { @include vc-styles.basic(); }`

There is also a mixin for adding default styling to the pop up modal which can be very handy. You can import that in a similar way, only this time it should be scoped to the html. The modal will be added and removed from the body tag, but overflow will need to added to the html in order to prevent scrolling. This is all build in to the modal styles

`@use 'NodeModules/@pernod-ricard-global-cms/onion-videocontroller/vc-styles';`

`html { @include vc-styles.modal(); }`

## ACF Fields

All the fields in the twig video-component template are intended to correspond to the fields in the generic video field group in the acf custom field groups. This video group can be injected into blocks within a tab or cloned into more nested sections of blocks.
It is recommended to use this field group as otherwise some of the features of the controller may not work. If you can't use the acf field group for some reason you can still hard code all the variables into the html attribute slots on the video component and trigger. It won't be dynamic but it can still work.

## Other useful features

Because it works as a singleton you can instantiate the videocontroller anywhere in your site and access some global methods.
Eg. Anywhere in the javascript on the page you can do,

`const videoController = new videcontroller();`
`videoController.stopAllVideos();`

These methods include:

- stopAllVideos(): This will stop all the videos on the page except for ones that have been assigned to autoplay.
- getGlobalSettings(): Returns the global videcontroller settings.
- getObjects(): Returns the collection of video containers and triggers that have been found by the controller.
