import Player from "@vimeo/player";
import {
	generateModal,
	revealVideoElement,
	hideVideoElement,
	stopVideos,
	resizeDebouncer
} from "./vcUtils.mjs";

const players = new Map();

function vimeoInit(videoObject) {
	updateVimeoSource(videoObject);
}

function updateVimeoSource(videoObject) {
	const { videocontainer, autoplay, muted, controls, loop, globalSettings } = videoObject;
	const desktopUrl = videocontainer.dataset.vimeoDesktopUrl;
	const mobileUrl = videocontainer.dataset.vimeoMobileUrl;
	const srcDesktop = videocontainer.dataset.vimeodesktopid;
	const srcMobile = videocontainer.dataset.vimeomobileid;

	const vimeoUrl = window.innerWidth < globalSettings.srcBreakpoint && mobileUrl ? mobileUrl : desktopUrl;
	const vimeoId = window.innerWidth < globalSettings.srcBreakpoint && srcMobile ? srcMobile : srcDesktop;

	if (!vimeoId) {
		console.error("No Vimeo ID found");
		return;
	}

	const playerId = `vimeo-${videoObject.videoid}-${srcDesktop}`;
	videoObject.playerId = playerId;

	const options = {
		url: vimeoUrl,
		autopause: autoplay === 1 ? 0 : 1,
		autoplay,
		muted,
		controls,
		loop,
	};

	if (players.has(playerId)) {
		const playerData = players.get(playerId);
		playerData.player.loadVideo(vimeoId);
	} else {
		const player = new Player(playerId, options);
		players.set(playerId, { initialized: true, player, videoObject });
		setupEventListeners(videoObject);
	}
}

function triggerVimeo(videoObject) {
	const { playerId, modal, isAdmin, globalSettings } = videoObject;

	if (modal && !isAdmin) {
		generateModal(videoObject);
	}

	const playerData = players.get(playerId);
	if (playerData) {
		playerData.player.play();
		globalSettings.enableDebugLogs &&
			console.log(`Playing Vimeo video: ${playerId}`);
	} else {
		console.error(`Vimeo player not initialized for ${playerId}`);
	}
}

function setupEventListeners(videoObject) {
	const { playerId, globalSettings } = videoObject;
	const player = players.get(playerId).player;
	
	player.on("loadedmetadata", () => {
		videoObject.instance.setVideoReadyState(videoObject, true);
	});
	
	player.on("play", () => {
		globalSettings.enableDebugLogs && console.log("Playing the video");
		stopVideos(videoObject);
		revealVideoElement(videoObject);
	});

	player.on("pause", () => {
		globalSettings.enableDebugLogs && console.log("Pausing the video");
		hideVideoElement(videoObject);
	});

	player.on("ended", () => {
		globalSettings.enableDebugLogs && console.log("Video ended");
		hideVideoElement(videoObject);
	});
}

resizeDebouncer(() => {
	players.forEach(({ videoObject }) => {
		updateVimeoSource(videoObject);
	});
});

const api = {
	vimeoInit,
	triggerVimeo,
};

export default api;
