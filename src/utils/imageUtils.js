import Compressor from "compressorjs";

/**
 *
 * @param base64
 * @param filename
 * @returns {File}
 */
export function base64ToFile(base64, filename = "file") {
  let arr = base64.split(",");
  let mime = arr[0].match(/:(.*?);/)[1];
  let suffix = mime.split("/")[1];
  let bStr = atob(arr[1]);
  let n = bStr.length;
  let u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bStr.charCodeAt(n);
  }
  return new File([u8arr], `${filename}.${suffix}`, {
    type: mime
  });
}

/**
 *
 * @param file
 * @param callback
 */
export function fileToBase64(file, callback) {
  let reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = function (e) {
    callback(e.target.result);
  }
}

/**
 * @param {*} base64
 * @param {number} ratio
 * @param {number} width
 * @param {number} height
 * @param callback
 */
export function imageCompress(base64, ratio, width, height, callback) {
  const file = base64ToFile(base64);
  new Compressor(file, {
    quality: ratio,
    width: width,
    height: height,
    resize: "cover",
    success(result) {
      fileToBase64(result, (base64Image) => {
        callback(base64Image);
      });
    },
    error(err) {
      console.log(err.message);
    }
  });
}
