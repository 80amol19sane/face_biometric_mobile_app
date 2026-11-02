/** Must equal "Embedding Model" in Face Biometric Settings, or the server refuses enrolment. */
export const MODEL_VERSION = 'mobilefacenet-v1';

export const MODEL_INPUT_SIZE = 112;
export const MODEL_PIXEL_MEAN = 128;
export const MODEL_PIXEL_STD = 128;

/** Frames averaged into the enrolled template. */
export const ENROL_FRAMES = 3;

/** How long a person gets to finish the liveness challenge and a straight-on capture. */
export const CAPTURE_TIMEOUT_MS = 25_000;

/** Longest side of the frame given to the face detector. Full camera photos are slow and add nothing. */
export const DETECTION_MAX_SIDE = 720;

/** Shows what the detector sees at the top of the camera. Turn off once capture is proven on devices. */
export const SHOW_DIAGNOSTICS = true;
