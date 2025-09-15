import youtubeVideo from './youtube-video.mjs';
import uploadVideo from './upload-video.mjs';
import vimeoVideo from './vimeo-video.mjs';
import {revealVideoElement, stopVideos, isWpAdmin} from './vcUtils.mjs';

export default class videoController {
	constructor(parentContainer) {
		const SRC_BREAKPOINT = 768;
		let defaultGlobalSettings = {
			srcBreakpoint: SRC_BREAKPOINT,
			bodyClass: 'video-playing',
			playingState: false,
			playingStateClass: 'video-playing',
			originDomain: globalThis.location?.origin,
			enableDebugLogs: true,
			isMobileSize: window.innerWidth < SRC_BREAKPOINT
		};
		if (parentContainer) {
			this.videoContainers =
				parentContainer.querySelectorAll('[data-videoid]');
		}
		this.videoReadyState = false;
		if (videoController.instance instanceof videoController) {
			videoController.instance.setVideoObjects(
				this.videoReadyState,
				this.videoContainers,
				parentContainer
			);
			return videoController.instance;
		}
		videoController.instance = this;
		this.globalSettings = defaultGlobalSettings;
		this.enableDebugLogs = this.globalSettings.enableDebugLogs;
		this.containerCollection = {};
		this.setVideoObjects(
			this.videoReadyState,
			this.videoContainers,
			this.triggers,
			parentContainer
		);
	}
	/**
	 * Method for setting up the video container objects and adding the listeners to the triggers
	 * @param {array} videoContainers - The video containers you want to add to the controller
	 * @param {array} triggers - The triggers you want to add to the controller
	 * @param {HTMLElement} parentContainer - The parent container of the video containers/triggers
	 */
	setVideoObjects(videoReadyState, videoContainers, parentContainer) {
		this.enableDebugLogs && console.log('Setting video Objects');
		if (!videoContainers) {
			this.enableDebugLogs &&
				console.info(`Did not look for video containers`);
			return;
		}
		if (videoContainers.length === 0) {
			this.enableDebugLogs &&
				console.info(
					`could not find any video containers in ${parentContainer}`
				);
			return;
		}

		videoContainers.forEach((container) => {
			if (!container) {
				return;
			}
			const videoObject = {
				videocontainer: container,
				videotype: container.dataset?.videotype,
				videoid: container.dataset?.videoid,
				videoReadyState: videoReadyState,
				youtubeplayer: false,
				vimeoplayer: false,
				parentcontainer: parentContainer,
				modalcontainer: '',
				modal: Number(container.dataset?.modal),
				isAdmin: isWpAdmin(),
				fullscreen: Number(container.dataset?.fullscreen),
				autoplay: this.setVideoAutoplay(container),
				controls: Number(container.dataset?.controls),
				loop: Number(container.dataset?.loop) || 0,
				muted: Number(container.dataset?.muted) || 0,
				sources: {
					desktop: container.dataset?.desktopvideo,
					mobile: container.dataset?.mobilevideo
				},
				instance: this,
				globalSettings: this.getGlobalSettings()
			};

			if (!videoObject.videoReadyState) {
				if (videoObject.autoplay == 1) {
					this.loadingSpinner(videoObject);
				}
				if (videoObject.videotype === 'upload') {
					uploadVideo.uploadedVideoInit(videoObject);
				}
				if (videoObject.videotype === 'youtube') {
					youtubeVideo.youtubeInit(videoObject);
				}
				if (videoObject.videotype === 'vimeo') {
					vimeoVideo.vimeoInit(videoObject);
				}
			}
			const triggers = document.querySelectorAll(
				`[data-triggerid='${container.dataset?.videoid}']`
			);

			if (triggers.length === 0) {
				this.enableDebugLogs &&
					console.log(
						`could not find any triggers in ${parentContainer}`
					);
				return;
			}

			triggers.forEach((trigger) => {
				if (!trigger) {
					return;
				}
				if (!trigger?.dataset?.triggerid) {
					this.enableDebugLogs &&
						console.log(
							trigger,
							`was missing an id so the listener could not be attached`
						);
					return;
				}
				trigger.addEventListener('click', () => {
					this.triggerVideo(
						this.containerCollection[trigger.dataset.triggerid]
					);
				});
			});
			videoObject.trigger = triggers;
			this.containerCollection[videoObject.videoid] = videoObject;
		});
	}
	setVideoReadyState(videoObject, isLoaded) {
		videoObject.videoReadyState = isLoaded;
	}
	setVideoAutoplay(container) {
		if (document.body.classList.contains('wp-admin')) {
			return 0;
		}

		return this.globalSettings.isMobileSize
			? Number(container.dataset?.autoplayMobile) || 0
			: Number(container.dataset?.autoplay) || 0;
	}
	/**
	 * Method to return the global settings for the video controller.
	 * @returns {Object} - the global settings object.
	 */
	getGlobalSettings() {
		return this.globalSettings;
	}
	/**
	 * Method to add or override the global controller settings.
	 * @param {Object} settings - Settings object that will be merged with the controller's existing settings.
	 */
	setGlobalSettings(settings = {}) {
		this.globalSettings = {...this.globalSettings, ...settings};
	}
	/**
	 * Method for getting the current collection of containers and triggers.
	 * @returns {Object} - Object container the container and triggers collections.
	 */
	getObjects() {
		const data = {
			videos: this.containerCollection,
			triggers: this.triggers
		};
		return data;
	}
	/**
	 * Method to determine which video to play and what type it is.
	 * @param {Object} videoObject - The video/trigger object that is used to identify which video element is being triggered.
	 */
	triggerVideo(videoObject) {
		if (!videoObject.instance) {
			videoObject.instance = this;
		}
		if (!videoObject.globalSettings) {
			videoObject.globalSettings = this.getGlobalSettings();
		}
		this.loadingSpinner(videoObject);
		stopVideos(videoObject);
		switch (videoObject.videotype) {
			case 'upload':
				uploadVideo.triggerUploadedVideo(videoObject);
				break;
			case 'youtube':
				youtubeVideo.triggerYoutube(videoObject);
				break;
			case 'vimeo':
				vimeoVideo.triggerVimeo(videoObject);
				break;
			default:
				break;
		}
	}
	stopAllVideos() {
		stopVideos({videoid: '', instance: this}, true);
	}
	loadingSpinner(videoObject) {
		const loadingWrapper = document.createElement('div');
		loadingWrapper.className = 'loading-wrapper';
		if (!videoObject.videocontainer) {
			return;
		}
		videoObject.videocontainer.appendChild(loadingWrapper);
		revealVideoElement(videoObject);

		const checkVideoReadyState = setInterval(() => {
			if (videoObject.videoReadyState === true) {
				clearInterval(checkVideoReadyState);
				videoObject.videocontainer.removeChild(loadingWrapper);
			}
		}, 100);
	}
}
