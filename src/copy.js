function copyElementToClipboard(element) {
  window.getSelection().removeAllRanges();
  let range = document.createRange();
  range.selectNode(typeof element === 'string' ? document.getElementById(element) : element);
  window.getSelection().addRange(range);
  document.execCommand('copy');
  window.getSelection().removeAllRanges();
}

window.addEventListener('load', function() {
  const woapBtn = document.getElementById('woap-btn');
  const woapHTML = document.getElementById('woap-body');
  woapBtn.addEventListener('click', function() {
    copyElementToClipboard(woapHTML);
    alert('复制到公众号')
  }, false);
})