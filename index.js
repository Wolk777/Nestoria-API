(function(){
	let locationSearch, numberPage, arrayListings, favoriteList;

	function init() {
		locationSearch = null;
		numberPage = null;
		arrayListings = [];
		favoriteList = {};

		document.getElementById("modal-overlay").addEventListener("click",closeModal);
		document.getElementById("btnSearch").addEventListener("click",hendlerSearch);
		document.getElementById("heartFavorite").addEventListener("click", hendlerHeart);
		document.getElementById("modal").addEventListener("click", hendlerClickModal);

		if(window.localStorage.getItem("favorite")) {
			favoriteList = JSON.parse(window.localStorage.getItem("favorite"))
		}else{
			window.localStorage.setItem("favorite", JSON.stringify(favoriteList))
		}
	}

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
		document.getElementById("modalLitle").innerHTML = `<p class="messageLitleModal">${str}<p>`
	}

	function openModalFavorite() {
		let favorite = JSON.parse(window.localStorage.getItem("favorite"));
		
		if(isEmptyObject(favorite)) {
			document.getElementById("modal").innerHTML = `<p class="messageEmptyFavorite">The list of favorite ads is empty. 
			Click on the heart to add an ad to your favorites.<p>`;
			return;
		}
		
		document.getElementById("modal").innerHTML = "";
		for (let key in favorite) {
			createListing(favorite[key], ".modal");
		}
	}

	function createListing(listing, selector) {
		let url = listing.lister_url;
		let classHeart = (url in favoriteList) ? "fas" : "far";
		let strContent = `
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
		</div>`
		document.querySelector(selector).insertAdjacentHTML("beforeend", strContent);
	}

	function createModalListing(url, container) {
		let listing = (container === ".containerMain") ? arrayListings.find(item => item.lister_url === url) : favoriteList[url];

		let separator = " &#183 ";
		let classHeart = (url in favoriteList) ? "fas" : "far";
		let strKeywords = separator + listing.keywords.split(", ").join(separator);
		let strSize = !listing.size ? "" : separator + listing.size + " sq.ft";
		let strBedroom = !listing.bedroom_number ? "" : listing.bedroom_number === 1 
		? separator + listing.bedroom_number + " Bedroom" : separator + listing.bedroom_number + " Bedrooms";
		let strBathroom = !listing.bathroom_number ? "" : listing.bathroom_number === 1 
		? separator + listing.bathroom_number + " Bath" : separator + listing.bathroom_number + " Baths";
		let strContent = `
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

	function createListListings(response) {
		if(numberPage === 1) {
			document.querySelector(".main").innerHTML = `
				<div class="containerMain"></div>
				<div class="btnLoad">
					<button>Load more...</button>
				</div>
			`;
			document.querySelector(".btnLoad").addEventListener("click", loadListings);
			document.querySelector(".containerMain").addEventListener("click", checkTarget);
		}

		let listings = response.response.listings;
		for(let listing of listings){
			createListing(listing, ".containerMain");
		}
	}

	function changeHeart(heart, url) {
		if(heart.getAttribute("class").includes("far")) {
			heart.classList.remove("far");
			heart.classList.add("fas");
			saveToFavorites(url);
		}else{
			heart.classList.remove("fas");
			heart.classList.add("far");
			removeFromFavorites(url);
		}
	}

	function hendlerSearch() {
		locationSearch = document.getElementById("inputSearch").value;
		
		if(locationSearch === ""){
			openLitleModal("Search fields are empty! Please enter a place to search!");
			return;
		}

		numberPage = 1;
		arrayListings = [];
		document.getElementById("inputSearch").value = "";
		document.querySelector(".main").innerHTML = "";

		findLocation(locationSearch, numberPage);	
	}

	function hendlerHeart(e) {
		e.preventDefault();
		openModal("modal");
		openModalFavorite();
	}

	function hendlerClickModal(e) {
	  e.preventDefault();
	  if(e.target.tagName === "H3") {
	  	let url = e.target.parentElement.parentElement.parentElement.dataset.url;;
			createModalListing(url);
	  }
	  if(e.target.className.includes("fa-heart")) {
			let heart = e.target;
			let url = heart.dataset.url;

			changeHeart(heart,url);

			if(heart.id !== "heartFullInfo") {
				openModalFavorite()
			};
			
			let heartList = document.querySelector(".containerMain");
			if(heartList) {
				let arrListing = heartList.querySelectorAll(".fa-heart");
				for (let item of arrListing) {
					if(item.dataset.url === url) {
						changeHeart(item, url);
					}
				}
			}
		}
	}

	function findLocation (location, numberPage) {
		fetch(`https://cors-anywhere.herokuapp.com/https://api.nestoria.co.uk/api?encoding=json&pretty=1
			&action=search_listings&country=uk&listing_type=rent&page=${numberPage}&place_name=${location}`)
	  .then(response => response.json())
	  .then(result => checkResponse(result))
	  .catch(err => openLitleModal("An error occurred while loading data. Please try the search again. We apologize."))
	}

	function checkResponse(response) {
		let codeResponse = response.response.application_response_code;
		let textResponse = response.response.application_response_text;
		if(codeResponse < 100 || codeResponse > 199) {
			checkCodeError(codeResponse, textResponse);
			return;
		}

		let listings = response.response.listings;
		arrayListings = [...arrayListings,...listings];
		createListListings(response);
	}

	function checkCodeError(code, text) {
		let codes = ["200", "201", "202", "210", "500", "900", "901", "902", "910", "911"];

		if(codes.includes(code)) {
			openLitleModal(text[0].toUpperCase() + text.slice(1));
			return;
		}		

		openLitleModal("Error loading data. Check the entered data and repeat the search.");
	}

	function checkTarget(e){
	  e.preventDefault();
    if(e.target.tagName === "H3") {
    	let url = e.target.parentElement.parentElement.parentElement.dataset.url;;
    	openModal("modal");
  		createModalListing(url, ".containerMain");
    }
    if(e.target.className.includes("fa-heart")) {
    	let heart = e.target;
			let url = heart.dataset.url;
			changeHeart(heart, url);
    }
	}

	function loadListings() {
		numberPage ++;
		findLocation (locationSearch, numberPage);
	}

	function saveToFavorites(url) {
		favoriteList[url] = arrayListings.find(item => item.lister_url === url);
		window.localStorage.setItem("favorite", JSON.stringify(favoriteList));
	};

	function removeFromFavorites(url) {
		delete favoriteList[url];
		window.localStorage.setItem("favorite", JSON.stringify(favoriteList));
	};

	function isEmptyObject(obj) {
	  for (let i in obj) {
	    if (obj.hasOwnProperty(i)) {
	      return false;
	    }
	  }
	  return true;
	}

	init();
})()