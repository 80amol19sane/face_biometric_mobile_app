/** Must equal "Embedding Model" in Face Biometric Settings, or the server refuses enrolment. */
export const MODEL_VERSION = 'mobilefacenet-v1';

export const MODEL_INPUT_SIZE = 112;
export const MODEL_PIXEL_MEAN = 128;
export const MODEL_PIXEL_STD = 128;

/** Frames averaged into the enrolled template. */
export const ENROL_FRAMES = 3;

/** How long a person gets to finish the liveness challenge and a straight-on capture. */
export const CAPTURE_TIMEOUT_MS = 25_000;
