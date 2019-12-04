(function(){
	let locationSearch;
	let numberPage;
	let arrayListings;
	let favoriteList;
  
	function openModal(typeModal) {
		document.getElementById("modal").innerHTML = "";
		document.getElementById("modal-overlay").classList.remove("modal_closed");
		document.getElementById(typeModal).classList.remove("modal_closed");
	}

	function closeModal() {
		document.getElementById("modal-overlay").classList.add("modal_closed");
		document.getElementById("modal").classList.add("modal_closed");
		document.getElementById("modalLitle").classList.add("modal_closed");
	}

	function openLitleModal(str) {
		openModal("modalLitle");
		document.getElementById("modalLitle").innerHTML = `<p class="messageLitleModal">${str}<p>`;
	}

	function findItem(arr, itemUrl) {
		return arr.find(item => item.lister_url === itemUrl);
	}

	function saveToFavorites(url) {
		favoriteList.push(findItem(arrayListings, url));
		window.localStorage.setItem("favorite", JSON.stringify(favoriteList));
	}

	function removeFromFavorites(url) {
		favoriteList.forEach((item, index) => {
			if (item.lister_url === url) {
				favoriteList.splice(index, 1)
			}
		})

		window.localStorage.setItem("favorite", JSON.stringify(favoriteList));
	}

	function createListing(listing, selector) {
		const url = listing.lister_url;
		const classHeart = findItem(favoriteList, url) ? "fas" : "far";
		const strContent = `
		<div class="listing" data-url=${listing.lister_url}>
			<figure class="thumb">
				<img src=${listing.thumb_url} alt="photo of the ${listing.property_type}">
				<i class="${classHeart} fa-heart" data-url=${url}></i>
			</figure>
			<div>
				<div class="titleListings">
					<h3>${listing.title}</h3>
				</div>
				<p>
					<span class="highlight">${listing.property_type[0].toUpperCase() + listing.property_type.slice(1)}</span> &#183  
					Keywords: ${listing.keywords} &#183 ${listing.summary} 
					<span class="highlight">${listing.price_formatted}pm</span>
				</p>
			</div>		
		</div>`;
		document.querySelector(selector).insertAdjacentHTML("beforeend", strContent);
	}

	function checkCodeError(code, text) {
		const codes = ["200", "201", "202", "210", "500", "900", "901", "902", "910", "911"];

		if (codes.includes(code)) {
			openLitleModal(text[0].toUpperCase() + text.slice(1));
			return;
		}		

		openLitleModal("Error loading data. Check the entered data and repeat the search.");
	}

	function checkResponse(response) {
		const codeResponse = response.response.application_response_code;
		const textResponse = response.response.application_response_text;
		if (codeResponse < 100 || codeResponse > 199) {
			checkCodeError(codeResponse, textResponse);
			return;
		}

		const {listings} = response.response;
		arrayListings = [...arrayListings,...listings];
		createListListings(response);
	}

	function findLocation (location) {
		fetch(`https://cors-anywhere.herokuapp.com/https://api.nestoria.co.uk/api?encoding=json&pretty=1
			&action=search_listings&country=uk&listing_type=rent&page=${numberPage}&place_name=${location}`)
	  .then(response => response.json())
	  .then(result => checkResponse(result))
	  .catch(() => openLitleModal("An error occurred while loading data. Please try the search again. We apologize."))
	}

	function loadListings() {
		numberPage +=1;
		findLocation (locationSearch);
	}

	function createModalListing(url, container) {
		let strBedroom;
		let strBathroom;
		const listing = (container === "#containerMain") ? findItem(arrayListings, url) : findItem(favoriteList, url);
		const separator = " &#183 ";
		const classHeart = findItem(favoriteList, url) ? "fas" : "far";
		const strKeywords = separator + listing.keywords.split(", ").join(separator);
		const strSize = !listing.size ? "" : `${separator + listing.size  } sq.ft`;

		if (!listing.bedroom_number) {
			strBedroom = "";
		}
		const bedroomTitle = listing.bedroom_number === 1 ? " Bedroom " : " Bedrooms";
		strBedroom = `${separator} ${listing.bedroom_number} ${bedroomTitle}`;

		if (!listing.bathroom_number) {
			strBathroom = "";
		}
		const bathroomTitle = listing.bathroom_number === 1 ? " Bath" : " Baths";
		strBathroom = `${separator} ${listing.bathroom_number} ${bathroomTitle}`;

		const strContent = `
			<div class="listingModal">
				<div class="photo">
					<img src=${listing.img_url} alt="photo of the ${listing.property_type}">
					<i class="${classHeart} fa-heart" id="heartFullInfo" data-url=${url}></i>
				</div>				
				<div class="listingContent">
					<div class="titleListing"><h2>${listing.title}</h2></div>
					<div>
						<p>
							<strong>${listing.property_type[0].toUpperCase() + listing.property_type.slice(1)}</strong>
							${strKeywords}
							${strSize}
							${strBedroom}
							${strBathroom}
						</p>
						<p>${listing.summary}</p>
						<p><span class="updated">${listing.updated_in_days_formatted}</span> on ${listing.datasource_name.toUpperCase()}</p>
					</div>
					<div class="priceListing"><p>${listing.price_formatted}pm</p></div>
				</div>
			</div>`;

		document.getElementById("modal").innerHTML = strContent;
	}

	function changeHeart(target) {
		const {url} = target.dataset;

		if (findItem(favoriteList, url)) {
			target.classList.remove("fas");
			target.classList.add("far");
			removeFromFavorites(url);
		} else {
			target.classList.remove("far");
			target.classList.add("fas");
			saveToFavorites(url)
		}
	}

	function checkTarget(e) {
	  e.preventDefault();
    if (e.target.tagName === "H3") {
    	const {url} = e.target.parentElement.parentElement.parentElement.dataset;
    	openModal("modal");
  		createModalListing(url, "#containerMain");
    }
    if (e.target.className.includes("fa-heart")) {
			changeHeart(e.target);
    }
	}

	function createListListings(response) {
		if (numberPage === 1) {
			document.querySelector("#main").innerHTML = `
				<div class="containerMain" id="containerMain"></div>
				<div class="btnLoad" id="btnLoad">
					<button>Load more...</button>
				</div>
			`;
			document.querySelector("#btnLoad").addEventListener("click", loadListings);
			document.querySelector("#containerMain").addEventListener("click", checkTarget);
		}

		const {listings} = response.response;
		listings.forEach(listing => createListing(listing, "#containerMain"));
	}

	function isEmptyObject(obj) {
		const arrKeys = Object.keys(obj);
		if(arrKeys.length === 0) {
			return true;
		}
	  return false;
	}

	function openModalFavorite() {
		const favorite = JSON.parse(window.localStorage.getItem("favorite"));
		
		if (isEmptyObject(favorite)) {
			document.getElementById("modal").innerHTML = `<p class="messageEmptyFavorite">The list of favorite ads is empty. 
			Click on the heart to add an ad to your favorites.<p>`;
			return;
		}
		
		document.getElementById("modal").innerHTML = "";
		favorite.forEach(item => createListing(item, "#modal"));
	}
	
	function handlerSearch() {
		const location = document.getElementById("inputSearch").value;
		
		if (location === "") {
			openLitleModal("Search fields are empty! Please enter a place to search!");
			return;
		}
		
		locationSearch = location;
		numberPage = 1;
		arrayListings = [];
		document.getElementById("inputSearch").value = "";
		document.querySelector("#main").innerHTML = "";

		findLocation(locationSearch);	
	}

	function handlerHeart(e) {
		e.preventDefault();
		openModal("modal");
		openModalFavorite();
	}

	function handlerClickModal(e) {
	  e.preventDefault();
	  if (e.target.tagName === "H3") {
	  	const {url} = e.target.parentElement.parentElement.parentElement.dataset;
			createModalListing(url);
	  }

	  if (e.target.className.includes("fa-heart")) {
			changeHeart(e.target);
			if (e.target.id !== "heartFullInfo") {
				openModalFavorite();
			};
			
			const heartList = document.querySelector("#containerMain");
			const {url} = e.target.dataset;
			if (heartList) {
				const arrListing = heartList.querySelectorAll(".fa-heart");
				arrListing.forEach(item => {
					if (item.dataset.url === url) {
						if (findItem(favoriteList, url)) {
							item.classList.remove("far");
							item.classList.add("fas");
						} else {
							item.classList.remove("fas");
							item.classList.add("far");
						}
					}
				})
			}
		}
	}

	function init() {
		locationSearch = null;
		numberPage = null;
		arrayListings = [];
		favoriteList = [];

		document.getElementById("modal-overlay").addEventListener("click",closeModal);
		document.getElementById("btnSearch").addEventListener("click",handlerSearch);
		document.getElementById("heartFavorite").addEventListener("click", handlerHeart);
		document.getElementById("modal").addEventListener("click", handlerClickModal);

		if (window.localStorage.getItem("favorite")) {
			favoriteList = JSON.parse(window.localStorage.getItem("favorite"));
		} else {
			window.localStorage.setItem("favorite", JSON.stringify(favoriteList));
		}
	}

	init();
})()
