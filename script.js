/**
 * It converts string into html object
 * @param {string} htmlString
 * @return {htmlObject}
 */
const ConvertStringToHTML = function (htmlString) {
  let parser = new DOMParser();
  let doc = parser.parseFromString(htmlString, "text/html");
  return doc;
};

/**
 * Creating a div and h1 tage,
 * inserting error message in h1 tag,
 * showing that error message on browser
 * @param {string} errorMssg
 */
const showError = function (errorMssg) {
  const container = document.createElement("div");
  container.classList.add("container");
  const h1 = document.createElement("h1");
  h1.innerText = errorMssg;
  container.append(h1);
  document.body.innerHTML = "";
  document.body.appendChild(container);
};

/**
 * Removing all \n from the html string.
 * Fixing the relative paths of the url.
 * Converting string to html.
 * Removing the header container of the page.
 * @param {string} htmlString
 * @return {htmlObejct}
 */
const cleanUp = function (htmlString) {
  let str = htmlString.replaceAll(/\\n/g, "");
  str = str.replaceAll(/\"\/wiki\//g, '"https://en.wikisource.org/wiki/');
  str = str.replaceAll(/\"\/w\//g, '"https://en.wikisource.org/w/');
  str = str.replaceAll(/\"\/\/upload\./g, '"https://upload.');

  const doc = ConvertStringToHTML(str);

  const headContainer = doc.getElementById("headerContainer");
  if (headContainer) headContainer.remove();
  return doc;
};

/**
 * Fetching the content of the main page in a form of html string by calling getData Function.
 * Storing the title of the anchor tags in the chapters array,
 * whose href attribute contain page title, this will help us to get the content of all subpage/chapters.
 * Calling getContent function
 * @param {string} text
 */
const getChapters = async function (text) {
  const page = text.trim().replaceAll(" ", "_");
  const chapters = [];
  const data = await getData(page);

  if (data.error) {
    showError(data.error.info);
    return;
  }
  const doc = cleanUp(data.parse.text["*"]);
  const anchorTags = doc.getElementsByTagName("a");

  // Small Hack
  // Replacing them because search operation will not work properly for opening and closing parantheses
  // replacing all opening paranthese with op, and closing paranthese with cl
  var str = page.replaceAll(/\(/g, 'op');
  str = str.replaceAll(/\)/g, 'cl');

  for (var idx = 0; idx < anchorTags.length; ++idx) {
    var hrefAttr = anchorTags[idx].href;
    hrefAttr = hrefAttr.replaceAll(/\(/g, 'op');
    hrefAttr = hrefAttr.replaceAll(/\)/g, 'cl');
    if (hrefAttr.search(`https://en.wikisource.org/wiki/${encodeURI(str)}`) !== -1)
    {
      chapters.push(anchorTags[idx].title);
    }
  }

  getContent(chapters, page);
};

/**
 * Creating div tag to store all the content of the chapters.
 * Calling getData function for every title present in chapters array.
 * Storing the content of all chapters in a div,
 * and appending the div to the body element
 * @param {array} chapters
 * @param {string} mainPageTitle
 */
async function getContent(chapters, mainPageTitle) {
  const container = document.createElement("div");
  container.classList.add("container");

  // if no chapters are present than show the main page content
  if (chapters.length === 0) {
    chapters.push(mainPageTitle);
  }

  for (const chapter of chapters) {
    const page = chapter.trim().replaceAll(" ", "_");
    const data = await getData(page);
    const doc = cleanUp(data.parse.text["*"]);
    container.append(doc.body.firstChild);
  }
  document.body.innerHTML = "";
  document.body.appendChild(container);
}

/**
 * Fetching all the content of the pages,
 * using wikisource api.
 * @param {string} page
 */
async function getData(page) {
  const url =
    "https://en.wikisource.org/w/api.php?" +
    new URLSearchParams({
      action: "parse",
      page: page,
      prop: "text",
      format: "json",
      origin: "*",
    });

  const response = await fetch(url);
  const data = await response.json();

  return data;
}

/** form element*/
const form = document.querySelector("#form");

/** loader element */
const loader = document.querySelector("#preloader");

/**
 * when submit event is fire call,
 * make loader visible and,
 * call the getChapters function
 */
form.addEventListener("submit", (e) => {
  e.preventDefault();
  loader.style.display = "block";
  getChapters(document.querySelector("#textName").value);
});
