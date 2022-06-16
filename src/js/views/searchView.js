class SearchView {
  _parentElement = document.querySelector(".search");

  getQuery() {
    const query = this._parentElement.querySelector(".search__field").value;
    this._clearInput();
    return query;
  }

  _clearInput() {
    this._parentElement.querySelector(".search__field").value = "";
  }

  //publisher-subscriber pattern
  addHandlerSearch(handler) {
    //for the entire form element (enter + button)
    this._parentElement.addEventListener("submit", function (evt) {
      evt.preventDefault(); //page will not reload
      handler();
    });
  }
}

export default new SearchView();
