import { loadTensorflowModel, type TensorflowModel } from 'react-native-fast-tflite';
import { MODEL_INPUT_SIZE } from './config';
import { ModelAsset } from '../../modules/model-asset';
import { l2Normalize } from '../lib/embedding';

/** Name of the file the withModelAsset plugin puts in the native assets. */
const MODEL_FILE = 'mobilefacenet.tflite';

let modelPromise: Promise<TensorflowModel> | null = null;

/** Copied out of the APK and loaded once. */
export function loadEmbedder(): Promise<TensorflowModel> {
  modelPromise ??= ModelAsset.materialize(MODEL_FILE)
    .then((url) => loadTensorflowModel({ url }, []))
    .then(checkTensors);
  modelPromise.catch(() => (modelPromise = null));
  return modelPromise;
}

/** Refuses a model file whose tensors are not the ones this app was built for. */
function checkTensors(model: TensorflowModel): TensorflowModel {
  const [input] = model.inputs;
  const [output] = model.outputs;
  const expected = [1, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE, 3];
  if (input.dataType !== 'float32' || input.shape.join() !== expected.join()) {
    throw new Error(`Unexpected face model input ${input.dataType} [${input.shape}]`);
  }
  if (output.dataType !== 'float32' || output.shape.length !== 2) {
    throw new Error(`Unexpected face model output ${output.dataType} [${output.shape}]`);
  }
  return model;
}

export async function embed(input: Float32Array): Promise<Float32Array> {
  const model = await loadEmbedder();
  const [output] = await model.run([input.buffer as ArrayBuffer]);
  return l2Normalize(new Float32Array(output));
}
