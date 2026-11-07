// 그림 파일이 있으면 SVG 위에 덮어 보여 주고, 없으면 조용히 SVG 그림을 그대로 둡니다.
// attachPhoto(<img>, "img/p3", "") -> img/p3.jpg, .jpeg, .png, .webp 순서로 찾음.
window.attachPhoto = function (img, path, base) {
  var exts = ["jpg", "jpeg", "png", "webp"];
  var i = 0;
  function next() {
    if (i >= exts.length) { img.remove(); return; }
    img.src = (base || "") + path + "." + exts[i++];
  }
  img.onerror = next;
  next();
};
