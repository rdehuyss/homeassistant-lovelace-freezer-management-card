import Resources from './freezer-management-resources.js?v=0.1';

class FreezerManagementCard extends HTMLElement {

    async setConfig(config) {
        if (window.loadCardHelpers) {
            this.helpers = await window.loadCardHelpers();
        }
        if(!config.contents_notify) {
	      throw new Error('Please provide a "contents_notify" attribute to the notify file in which the freezer contents can be saved');
	    }
	    if(!config.contents_notify.startsWith('notify.')) {
	    	throw new Error('The notify file should start with "notify." You can copy the entity id via the Dashboard (Developer > States)');	
	    }
	    if(!config.contents_sensor) {
	      throw new Error('Please provide a "contents_sensor" attribute to the file sensor in which the freezer contents is saved');
	    }
	    if(!config.contents_sensor.startsWith('sensor.')) {
	    	throw new Error('The file sensor should start with "sensor." You can copy the entity id via the Dashboard (Developer > States)');	
	    }
	    this.contents_notify = config.contents_notify;
	    this.contents_sensor = config.contents_sensor;
	    this.shortcuts = config.shortcuts;
        this.style.display = 'block';
        this.potContents = '';
        this.potNumber = -1;
        this.potCompartment = -1;
        this.load();
    }

    set hass(hass) {
    	this._hass = hass;
    	this.load();
    }
    
    load() {
		if(this._hass && this.contents_sensor) {
			if(this.state == null || this.contents != this._hass.states[this.contents_sensor]) {
	    		this.contents = this._hass.states[this.contents_sensor];
	    		this.parseContentsFromHass();
	    		this.setState('show-start-button');
	    	}
		}
    }
    
    setState(state) {
    	this.state = state;
    	
    	this.innerHTML = `
            <ha-card header="${this._label("card-title")}">
            	<div class="card-content">
            		<div id="add-view"></div>
                	<div id="freezer-contents">
                	</div>
            	</div>
            </ha-card>
        `;
        this.showFreezerContents();
        
    	
    	if(this.state == 'show-start-button') {
    		this.showStartButton();
    	} else if (this.state == 'show-pot-content-screen') {
    		this.showPotContentInputScreen();
    	} else if (this.state == 'show-pot-number-screen') {
    		this.showPotNummerInputScreen();
    	} else if (this.state == 'show-pot-compartment-screen') {
    		this.showPotCompartmentInputScreen();
    	}
    }
    
    showStartButton() {
        this.querySelector('#add-view').innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 1em;">
    			<span style="display: inline-block;float: left;margin-top: 0.5em;">${this._label('add-food-container')}</span>
    			<mwc-button id="voeg-pot-toe" class="action">${this._label('add-food-container-next-button')}</mwc-button>
    		</div>
        `;
        this.querySelector('#voeg-pot-toe').addEventListener('click', () => this.setState('show-pot-content-screen'));
    }
    
    showPotContentInputScreen() {
        this.querySelector('#add-view').innerHTML = `
        	<div style="margin-bottom: 1em;">
        		<div style="margin-bottom: 1em;">
	            	<label>${this._label('food-container-contents-title')}</label>
	            </div>
	            <div id="shortcuts" style="margin-bottom: 1em;">
	            </div>
	            <div style="margin-bottom: 1em;">
	                <label>${this._label('food-container-contents-something-else')}</label><br/><br/>
	            	<ha-textfield id='pot-inhoud' type='text' style="width: 100%" label="${this._label('food-container-contents-label')}"></ha-textfield>
	            </div>
	            <div style="display: flex; justify-content: flex-end; width: 100%">
                	<mwc-button id="pot-inhoud-next" class="action">${this._label('food-container-contents-next-button')}</mwc-button>
                </div>
        	</div>
        `;
        
        for(let i = 0; i < this.shortcuts.length; i++) {
        	const shortcut = this.shortcuts[i];
        	this.querySelector('#shortcuts').insertAdjacentHTML('beforeend', `<mwc-button id="shortcut-${i}" class="action">${shortcut}</mwc-button>`);
        	this.querySelector(`#shortcut-${i}`).addEventListener('click', () => this.potContentSelected(shortcut));
        }
        this.querySelector('#pot-inhoud-next').addEventListener('click', () => this.potContentSelected(this.querySelector('#pot-inhoud').value));
    }
    
    potContentSelected(potContents) {
    	this.potContents = potContents;
    	this.setState('show-pot-number-screen');
    }
    
    showPotNummerInputScreen() {
        this.querySelector('#add-view').innerHTML = `
        	<div style="margin-bottom: 1em;">
        		<div>
	            	<label>${this._label('food-container-number')}</label><br/><br/>
	            	<ha-textfield id='pot-number' type='number' label="Pot nummer"></ha-textfield>
	            </div>
	            <div style="display: flex; justify-content: flex-end; width: 100%">
                	<mwc-button id="pot-number-next" class="action">${this._label('food-container-number-next-button')}</mwc-button>
                </div>
        	</div>
        `;
        this.querySelector('#pot-number-next').addEventListener('click', () => {
			this.potNumber = this.querySelector('#pot-number').value;
			this.setState('show-pot-compartment-screen');
		});
    }
    
    showPotCompartmentInputScreen() {
        this.querySelector('#add-view').innerHTML = `
        	<div style="margin-bottom: 1em;">
        		<div>
	            	<label>${this._label('food-container-compartment-number')}</label><br/><br/>
	            	<ha-textfield id='compartment-number' type='number' label="${this._label('food-container-compartment-number-label')}"></ha-textfield>
	            </div>
	            <div style="display: flex; justify-content: flex-end; width: 100%">
                	<mwc-button id="compartment-number-next" class="action">${this._label('food-container-compartment-number-submit-button')}</mwc-button>
                </div>
        	</div>
        `;
        this.querySelector('#compartment-number-next').addEventListener('click', () => {
			this.potCompartment = this.querySelector('#compartment-number').value;
			const newPot = { 'potContents': this.potContents, 'potNumber': this.potNumber, 'potCompartment': this.potCompartment, 'potDate': this.formatDate(new Date(), "d MMM"), 'potIsoDate': new Date().toISOString()};
			this.parsedContents = [newPot, ...this.parsedContents];
			this.saveContentsToHass();
			this.setState('show-start-button');
		});
    }
    
    showFreezerContents() {
    	this.querySelector('#freezer-contents').innerHTML = `
    		<table id="freezer-contents-table" style="width: 100%">
    			<tr><th align="left" style="width:45%">${this._label('food-table-container-contents')}</th><th align="right" style="width:15%">${this._label('food-table-container-number')}</th><th align="right" style="width:15%">${this._label('food-table-compartment-number')}</th><th align="right" style="width:20%">${this._label('food-table-container-date')}</th><th>&nbsp;</th></tr>
    		</table>`;
    	if(this.parsedContents) {
	    	for(const [index, option] of this.parsedContents.entries()) {
	    		this.querySelector('#freezer-contents-table').insertAdjacentHTML('beforeend', `<tr><td>${option.potContents}</td><td style="text-align: right">${option.potNumber}</td><td style="text-align: right">${option.potCompartment}</td><td style="text-align: right">${option.potDate}</td><td><ha-icon-button id="pot-delete-${index}"><ha-icon icon="mdi:delete"></ha-icon></ha-icon-button></td></tr>`);
	    		this.querySelector(`#pot-delete-${index}`).addEventListener('click', () => {
	    			this.parsedContents.splice(index, 1);
	    			this.saveContentsToHass();
	    		});
	    	}
    	}
    }

    _label(label, fallback = 'unknown') {
	    const lang = this._hass.selectedLanguage || this._hass.language;
	    const resources = Resources[lang];
		return resources && resources[label] ? resources[label] : fallback;
	}
	
	parseContentsFromHass() {
		this.parsedContents = this.contents.attributes['items'];
		this.parsedContents.sort(function (a, b) {
		    return a.potContents.localeCompare(b.potContents) || a.potIsoDate.localeCompare(b.potIsoDate);
		});
		for(let container of this.parsedContents) {
			if(container.potIsoDate !== '/' && !this.shortcuts.includes(container.potContents)) {
				this.shortcuts = [...this.shortcuts, container.potContents];
			}
		}
	}
	
	saveContentsToHass() {
		const contentToSave = { count: this.parsedContents.length, items: this.parsedContents };
		this._hass.callService("notify", "diepvries", { message: JSON.stringify(contentToSave) });
		this._hass.callService("homeassistant", "update_entity", { entity_id: this.contents_sensor });
	}
	
	formatDate(date, format) {
	  let result = format;
	  result = result.replace("yyyy", date.toLocaleDateString("en-US", { year: "numeric" }));
	  result = result.replace("yy", date.toLocaleDateString("en-US", { year: "2-digit" }));
	  result = result.replace("MMM", date.toLocaleDateString("en-US", { month: "short" }));
	  result = result.replace("MM", date.toLocaleDateString("en-US", { month: "2-digit" }));
	  result = result.replace("dd", date.toLocaleDateString("en-US", { day: "2-digit" }));
	  result = result.replace("d", date.toLocaleDateString("en-US", { day: "numeric" }));
	
	  return result;
	}

    getCardSize() {
        return 1;
    }

}

customElements.define('freezer-management-card', FreezerManagementCard);
