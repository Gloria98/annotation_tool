class Transcript_view {
    constructor(dom_container_id) {
        let container = document.getElementById(dom_container_id);
        this.container_id = dom_container_id;
        // this.dispatch = d3.dispatch("highlight");
        this.annotations = {};
        // height: 100vh; overflow-x:none; overflow-y:auto;
        container.innerHTML = "<div class=\"d-grid gap-3\" style=\"grid-template-columns: 2fr 1fr; position: relative;\">" +
            "<div class=\"bg-white border rounded-1\" id='transcript-container' style=\"padding: 20px; position: relative;\">\n" +

            "</div>" +
            "<div id=\"input-container\" style='width: 100%;'>" +
            "<button class=\"btn btn-outline-primary\" type=\"button\" data-bs-toggle=\"collapse\" data-bs-target=\"#entityTypes\" aria-expanded=\"false\" aria-controls=\"entityTypes\">\n" +
            "    Change the types of entites" +
            "  </button>" +
            "<div class=\"collapse\" id=\"entityTypes\">" +
            "  <div class=\"card card-body\">" +
            "<div class=\"form-check\">\n" +
            "  <input class=\"form-check-input\" type=\"checkbox\" value=\"\" id=\"entity-PERSON\" checked>\n" +
            "  <label class=\"form-check-label\" for=\"entity-PERSON\">\n" +
            "    <span class='entity-PERSON'>Person</span>" +
            "  </label>\n" +
            "</div>\n" +
            "<div class=\"form-check\">\n" +
            "  <input class=\"form-check-input\" type=\"checkbox\" value=\"\" id=\"entity-NORP\" checked>\n" +
            "  <label class=\"form-check-label\" for=\"entity-NORP\">\n" +
            "    <span class='entity-NORP'>Nationalities or religious or political groups</span>" +
            "  </label>\n" +
            "</div>" +
            "<div class=\"form-check\">\n" +
            "  <input class=\"form-check-input\" type=\"checkbox\" value=\"\" id=\"entity-ORG\" checked>\n" +
            "  <label class=\"form-check-label\" for=\"entity-ORG\">\n" +
            "    <span class='entity-ORG'>Organization</span>" +
            "  </label>\n" +
            "</div>" +
            "<div class=\"form-check\">\n" +
            "  <input class=\"form-check-input\" type=\"checkbox\" value=\"\" id=\"entity-GPE\" checked>\n" +
            "  <label class=\"form-check-label\" for=\"entity-GPE\">\n" +
            "    <span class='entity-GPE'>Countries, citites, states</span>" +
            "  </label>\n" +
            "</div>" +
            "<div class=\"form-check\">\n" +
            "  <input class=\"form-check-input\" type=\"checkbox\" value=\"\" id=\"entity-DATE\" checked>\n" +
            "  <label class=\"form-check-label\" for=\"entity-DATE\">\n" +
            "    <span class='entity-DATE'>Dates</span>" +
            "  </label>\n" +
            "</div>" +
            "<div class=\"form-check\">\n" +
            "  <input class=\"form-check-input\" type=\"checkbox\" value=\"\" id=\"entity-TIME\" checked>\n" +
            "  <label class=\"form-check-label\" for=\"entity-TIME\">\n" +
            "   <span class='entity-TIME'>Time</span>" +
            "  </label>\n" +
            "</div>" +
            "  </div>" +
            "</div>"+
            // "<div class=\"bg-white border rounded-1 \" id=\"note-container\" style='padding: 20px; margin-top: 20px;'>" +
            // "</div>" +
            "</div>" +
            "</div>"
    }

    // load transcript
    init() {
        let self = this;
        let filename = 'exhibit_01.json'
        this.filename= filename;

        let postArgs = {
            headers: {
                "credentials": 'include',
                "Content-Type": "application/json"
            },
            mode: 'no-cors',
            method: "post",
            withCredentials: true
        };
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                // Typical action to be performed when the document is ready:
                // document.getElementById("demo").innerHTML = xhttp.responseText;
                let data = JSON.parse(xhttp.responseText);
                console.log(data);
                self.show_transcript(data);
            }
        };
        xhttp.open("GET", "http://0.0.0.0:8985/files/" + filename, true);
        xhttp.send();

        // select the entity types to show or hide
        var checkboxes = document.querySelectorAll("input[type=checkbox]");

        checkboxes.forEach(function (checkbox) {
            checkbox.addEventListener('change', function () {
                if (checkbox.checked) {
                    d3.select('#transcript-container').selectAll('.'+checkbox.id).classed('hide', false);
                } else {
                    d3.select('#transcript-container').selectAll('.'+checkbox.id).classed('hide', true);
                }
            })
        })

    }

    // save the edited transcript into an object so it can be converted to json and saved in backend
    get_transcript_with_note() {
        let lines = document.getElementById('transcript-container').querySelectorAll("div[class*=transcript-lines]")
        let line_json = [];
        lines.forEach((line) => {
            let divs = line.querySelectorAll("div");
            line_json.push({speaker: divs[0].innerHTML, words: divs[1].innerHTML});
        })
        return {lines: line_json};
    }
    // show the loaded transcript
    show_transcript(data) {
        let self = this;
        // content of the transcript
        data['lines'].forEach(function (d) {
            // console.log(d);
            let box = d3.select('#transcript-container')
                .append('div')
                .classed('d-grid gap-3 transcript-lines', true)
                .style('grid-template-columns', '1fr 4fr');
            box.append('div').html(d['speaker']);
            box.append('div').html(d['words']);
            return;
        })

        // context menu for adding comments
        this.context_menu = d3.select("#" + this.container_id).select('#transcript-container')
            .append("div")
            .attr('id', 'context-menu')
            .html('<div class="item" id="add-comments">Add comments</div><div class="item" id="close">Close</div>');
        // handle the event of clicking on the context menu
        this.context_menu.selectAll('div').on('click', function (e) {
            let div_id = d3.select(this).attr("id");
            if (div_id==="add-comments") {
                // surround the selected range with a newly created span
                let newNode = document.createElement('span');
                newNode.className = 'highlight';
                try {
                    self.selected_range.surroundContents(newNode);
                } catch(e) { console.log(e) }
                self.context_menu.classed('visible',false);
                self.span_listener();
                // generate a note pad for the newly added annotation
                self.render_note_pad(newNode);
            }
            else {
                self.context_menu.classed('visible',false);
            }

        })
        this.selected_range = null;

        // handle selection in transcript
        document.onselectionchange = function () {
            let selected = window.getSelection();
            let selectedText = selected.toString();
            if (selectedText.length > 0) {
                let parentRect = document.getElementById("transcript-container").getBoundingClientRect();
                let clientRect = selected.getRangeAt(0).getBoundingClientRect();
                // let context_m = document.getElementById('transcript-container').createElement("div");
                // context_m.style.left = clientRect.x;
                // context_m.style.left = clientRect.x;
                // self.context_menu.style('left', '${clientRect.x}px').style('top', '${clientRect.y}px').classed('visible',true);
                self.context_menu.style('left', clientRect.x-parentRect.left +'px').style('top', clientRect.bottom-parentRect.top +'px').classed('visible',true);
                self.selected_range = selected.getRangeAt(0);
            }
        }

        this.span_listener();

    }

    // handle the event of clicking on a span
    span_listener() {
        let self = this;
        var spans = document.querySelector("div[id=transcript-container]").querySelectorAll("span");
        spans.forEach(function (span) {
            span.addEventListener('click', function () {
                // if this span has non-empty id, meaning that it has an associated annotation, then get the existing annotation from db
                if (span.id !== '') self.render_existing_note(span);
                else self.render_note_pad(span);
            });
        });
    }

    // create a div for annotation
    render_note_pad(span_object) {
        let self = this;
        // the right column of the interface
        let note_div = document.querySelector("div[id=input-container]");

        var notes = document.createElement("div");
        // select annotation type
        notes.innerHTML = "<p><span class='"+span_object.className+ "'>"+span_object.textContent+"<button type=\"button\" class=\"btn-close\" id='close-button' aria-label=\"Close\"></button></span></p>" +
            "<div class='note-content'>" +
            "<form>"+
            "<div class='mb-3' style='margin-top: 20px;'><select class=\"form-select\" aria-label=\"Default select example\">\n" +
            "  <option selected>Annotation Type</option>\n" +
            "  <option value=\"1\">Disambiguation</option>\n" +
            "  <option value=\"2\">Speculation</option>\n" +
            "</select></div>" +
            "</form></div>";
        let noteY = span_object.getBoundingClientRect().top-document.getElementById(self.container_id).getBoundingClientRect().top;
        notes.setAttribute("class", "bg-white border rounded-1");
        notes.setAttribute("style", "width:30%; padding: 20px; position: absolute; top:"+noteY+"px;")
        note_div.appendChild(notes);

        // handle selection of annotation type
        var anno_type_selection = note_div.querySelector('select');
        anno_type_selection.addEventListener("change", function () {
            let selected = anno_type_selection.value;
            if(selected==="1") self.render_disambiguation(span_object, notes);
            else self.render_speculation(span_object, notes);
        });
        // handle click at the close button
        var close_button = notes.querySelector("button[id=close-button]");
        close_button.addEventListener("click", function (e) {
            if (span_object.className === "highlight") {
                span_object.outerHTML = span_object.innerHTML;
            }
            // self.clean_note_pad();
            notes.remove();
        })
    }

    render_existing_note(span_object) {
        let self = this;
        let note_div = document.querySelector("div[id=input-container]");

        let ocid = parseInt(span_object.id.split("-")[1]);

        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                // Typical action to be performed when the document is ready:
                // document.getElementById("demo").innerHTML = xhttp.responseText;
                let data = JSON.parse(xhttp.responseText);
                console.log(data);
                var notes = document.createElement("div");
                notes.setAttribute('id', "ocid-" + ocid);
                notes.innerHTML = "<p><span class='"+span_object.className+ "'>"+span_object.textContent+
                    "<button type=\"button\" class=\"btn-close\" id='close-button' aria-label=\"Close\"></button></span>" +
                    "<button class=\"btn btn-primary\" type=\"button\" data-bs-toggle=\"collapse\" data-bs-target='#" + ("ocid-" + ocid + "-content") + "' aria-expanded=\"false\" aria-controls=\"collapseExample\">\n" +
                    " note </button></p>" +
                    "<div class='collapse' id='" + ("ocid-" + ocid + "-content") + "'><form>" +
                    "<div class=\"mb-3\">\n" +
                    "  <label for=\"note-container-fullname-input\" class=\"form-label\">Full Name</label>\n" +
                    "  <input type=\"email\" class=\"form-control\" id=\"note-container-fullname-input\" placeholder='" + data['oc_content']['fullname'] + "'>" +
                    "</div>" + self.disamb_form(data['oc_content']) +
                    "</form></div>"
                let noteY = span_object.getBoundingClientRect().top-document.getElementById(self.container_id).getBoundingClientRect().top;
                notes.setAttribute("class", "bg-white border rounded-1");
                notes.setAttribute("style", "width:30%; padding: 20px; position: absolute; top:"+noteY+"px;")
                note_div.appendChild(notes);
                // self.show_transcript(data);
            }
        };
        let url = "http://0.0.0.0:8985/get_comments/"+ocid;
        xhttp.open("GET", url, true);
        xhttp.send();

    }

    clean_note_pad() {
        let note_div = document.querySelector("div[id=note-container]");
        while (note_div.hasChildNodes()) {
            note_div.removeChild(note_div.firstChild);
        }
    }

    // if the annotation type is disambiguation, find candidate entities to link with the span
    render_disambiguation(span_object, note_object) {
        let self = this;
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {

                let data = JSON.parse(xhttp.responseText);
                console.log(data);
                self.render_candidate_entities(data, span_object, note_object);
                // self.show_transcript(data);
            }
        };
        let url = "http://0.0.0.0:8985/entities?" + "entity=" + span_object.textContent + "&type="+span_object.className;
        xhttp.open("GET", url, true);
        xhttp.send();
        note_object.querySelector("div[class=note-content]").innerHTML = "<img src = \"img/hourglass_spinner.svg\" alt=\"rendering\"/>";
    }

    // not finished yet
    render_speculation(span_object, note_object) {
        // let note_div = document.querySelector("div[id=note-container]");
        let input_html = "<form>" +
            "<div class=\"mb-3\">" +
            "  <label for=\"note-container-speculation\" class=\"form-label\">Speculation</label>" +
            "  <textarea class=\"form-control\" id=\"note-container-speculation\" rows=\"4\"></textarea>\n" +
            "</div>" +
            "<div class=\"mb-3\">" +
            "  <label for=\"note-container-evidence\" class=\"form-label\">Evidence</label>" +
            "  <textarea class=\"form-control\" id=\"note-container-evidence\" rows=\"4\"></textarea>\n" +
            "</div>" +
            "<label>Confidence</label> <div class=\"form-check form-check-inline\">\n" +
            "  <input class=\"form-check-input\" type=\"radio\" name='note-container-confidence' id=\"confidence1\" value='1'>\n" +
            "  <label class=\"form-check-label\" for=\"confidence1\">1</label>\n" +
            "</div>\n" +
            "<div class=\"form-check form-check-inline\">\n" +
            "  <input class=\"form-check-input\" type=\"radio\" name='note-container-confidence' id=\"confidence2\" value='2'>\n" +
            "  <label class=\"form-check-label\" for=\"confidence2\">2</label>\n" +
            "</div>\n" +
            "<div class=\"form-check form-check-inline\">\n" +
            "  <input class=\"form-check-input\" type=\"radio\" name='note-container-confidence' id=\"confidence3\" value='3'>\n" +
            "  <label class=\"form-check-label\" for=\"confidence3\">3</label>\n" +
            "</div>" +
            "<div><button type=\"button\" class=\"btn btn-primary\" id='note-container-submit-note'>Submit</button></div>" +
            "</form>";
        note_object.querySelector("div[class=note-content]").innerHTML = input_html;

    }

    //
    render_candidate_entities(data, span_object, note_object) {
        let self = this;
        let note_div = note_object.querySelector("div[class=note-content]");
        note_div.style.height = "90vh";
        note_div.style.overflowY = "auto";
        while (note_div.hasChildNodes()) {
            note_div.removeChild(note_div.firstChild);
        }
        // change the entity type
        note_div.innerHTML =
            "<div class='mb-3' style='margin-top: 20px;'><select id='note-container-entity-type' class=\"form-select\" aria-label=\"Default select example\">\n" +
            "  <option selected>Entity Type</option>\n" +
            "  <option value=\"entity-PERSON\">Person</option>\n" +
            "  <option value=\"entity-NORP\">Nationalities or political groups</option>\n" +
            "  <option value=\"entity-ORG\">Organization</option>\n" +
            "  <option value=\"entity-GPE\">Countries, cities, states</option>\n" +
            "  <option value=\"entity-DATE\">Date</option>\n" +
            "  <option value=\"entity-TIME\">Time</option>\n" +
            "</select></div>"

        // show candidate information
        data.forEach(function (cand) {
            var cand_div = document.createElement("div");
            cand_div.className = "bg-white border rounded-1";
            cand_div.style.marginBottom = "10px";
            let cand_info_html = "<button type=\"button\" class=\"candidate-entity\" id='" + cand['eid'] + "'>" + cand["title"] + "</button>" +
                "<div class='bg-white border rounded-1' style='overflow-y: auto; height: 20vh; margin: 5px; padding: 10px; font-size: 14px;'>" + cand["summary"] + "</div>" +
                "<div class='bg-white border rounded-1' style='overflow-y: auto; margin: 5px;'> <b> Related Entities: </b>";
            for (let i=0; i<5; i++) {
                cand_info_html += "<button type=\"button\">" + cand["entities"][i] + "</button>";
            }
            cand_info_html += "</div>";
            cand_div.innerHTML = cand_info_html;
            note_div.appendChild(cand_div);
        })
        note_div.innerHTML += "<button type=\"button\" class=\"btn btn-primary\" id='skip-button'>Skip</button>";

        // handle user selection of candidates
        var buttons = note_object.querySelectorAll("button[class=candidate-entity]");
        buttons.forEach(function (b) {
            b.addEventListener("click", function () {
                let selected_cand = data.filter((cand) => cand["eid"] === parseInt(b.id))[0];
                console.log(selected_cand);
                self.render_disamb_oc(selected_cand, span_object, note_object);
            })
        })

        // handle change of entity type
        var anno_type_selection = note_div.querySelector('select');
        anno_type_selection.addEventListener("change", function () {
            console.log("change");
            let selected = anno_type_selection.value;
            if(selected!==span_object.className) {
                span_object.className = selected;
                self.render_disambiguation(span_object, note_object);
            }
        })
        note_object.querySelector('button[id=skip-button]').addEventListener("click", function () {
            self.render_disamb_oc({}, span_object, note_object)
        })
    }

    // the html form for disambiguation annotation
    disamb_form(oc_content) {
        let html = "<div class=\"mb-3\">\n" +
            "  <label for=\"note-container-position-input\" class=\"form-label\">Position</label>\n" +
            "  <input type=\"text\" class=\"form-control\" id=\"note-container-position-input\" placeholder='"+oc_content.position+"'>\n" +
            "</div>" +
            "<div class=\"mb-3\">\n" +
            "  <label for=\"note-container-affiliation-input\" class=\"form-label\">Affiliation</label>\n" +
            "  <input class=\"form-control\" id=\"note-container-affiliation-input\" placeholder='"+oc_content.affiliation+"'>" +
            "</div>" +
            "<div class=\"mb-3\">" +
            "  <label for=\"note-container-role\" class=\"form-label\">Role in this conversion</label>" +
            "  <textarea class=\"form-control\" id=\"note-container-role\" rows=\"4\">" + oc_content.role +"</textarea>\n" +
            "</div>" +
            "<div class=\"mb-3\">" +
            "  <label for=\"note-container-evidence\" class=\"form-label\">Evidence</label>" +
            "  <textarea class=\"form-control\" id=\"note-container-evidence\" rows=\"4\">"+ oc_content.evidence +"</textarea>\n" +
            "</div>" +
            "<label>Confidence</label> <div class=\"form-check form-check-inline\">\n" +
            "  <input class=\"form-check-input\" type=\"radio\" name='note-container-confidence' id=\"confidence1\" value='1'>\n" +
            "  <label class=\"form-check-label\" for=\"confidence1\">1</label>\n" +
            "</div>\n" +
            "<div class=\"form-check form-check-inline\">\n" +
            "  <input class=\"form-check-input\" type=\"radio\" name='note-container-confidence' id=\"confidence2\" value='2'>\n" +
            "  <label class=\"form-check-label\" for=\"confidence2\">2</label>\n" +
            "</div>\n" +
            "<div class=\"form-check form-check-inline\">\n" +
            "  <input class=\"form-check-input\" type=\"radio\" name='note-container-confidence' id=\"confidence3\" value='3'>\n" +
            "  <label class=\"form-check-label\" for=\"confidence3\">3</label>\n" +
            "</div>" +
            "<div><button type=\"button\" class=\"btn btn-primary\" id='note-container-submit-note'>Submit</button></div>";
        return html
    }

    render_disamb_oc(data, span_object, note_object) {
        let note_div = note_object;
        let full_name = "Full name";
        let self = this;
        if ("title" in data) {
            full_name = data["title"]
        }
        // while (note_div.hasChildNodes()) {
        //     note_div.removeChild(note_div.firstChild);
        // }
        let input_html = "<form>" +
            "<div class=\"mb-3\">\n" +
            "  <label for=\"note-container-fullname-input\" class=\"form-label\">Full Name</label>\n" +
            "  <input type=\"email\" class=\"form-control\" id=\"note-container-fullname-input\" placeholder='" + full_name + "'>" +
            "</div>";
        if (!("title" in data)) {
            input_html += "<div id='note-container-name-search'><button type='button' class='btn btn-primary' id='note-container-name-search-submit'>Search</button></div>";
        }

        input_html += self.disamb_form({position: '', Affiliation: '', role: '', evidence: ''}) + "</form>";
        note_div.querySelector("div[class=note-content]").innerHTML = input_html;

        // give another change to search for entities if it was not associated with an entity
        if (!('title' in data)) {
            note_div.querySelector('button[id=note-container-name-search-submit]').addEventListener("click", function (e) {
                let input_name = note_div.querySelector("input[id=note-container-fullname-input]").value;
                var xhttp = new XMLHttpRequest();
                xhttp.onreadystatechange = function () {
                    if (this.readyState == 4 && this.status == 200) {
                        // Typical action to be performed when the document is ready:
                        // document.getElementById("demo").innerHTML = xhttp.responseText;
                        let data = JSON.parse(xhttp.responseText);

                        let candidate_html = "";
                        data.forEach(function (cand) {
                            candidate_html += "<button type=\"button\" class='candidate-entity'>" + cand["title"] + "</button>";
                        });
                        note_div.querySelector("div[id=note-container-name-search]").innerHTML = candidate_html;
                        var buttons = note_object.querySelectorAll("button[class=candidate-entity]");
                        buttons.forEach(function (b) {
                            b.addEventListener("click", function () {
                                let selected_cand = data.filter((cand) => cand["title"] === b.textContent)[0];

                                self.render_disamb_oc(selected_cand, span_object, note_object);
                            })
                        })
                    }
                };
                let url = "http://0.0.0.0:8985/entities?" + "entity=" + input_name + "&type=" + span_object.className;
                xhttp.open("GET", url, true);
                xhttp.send();
                note_div.querySelector("div[id=note-container-name-search]").innerHTML = "<img src = \"img/hourglass_spinner.svg\" alt=\"rendering\"/>";
            });
        }

        // when submit the form
        note_div.querySelector('button[id=note-container-submit-note]').addEventListener("click", function (e) {
            let ref_text = span_object.textContent;
            let fullname = ('title' in data) ? data['title'] : note_div.querySelector('input[id=note-container-fullname-input]').value;
            let position = note_div.querySelector('input[id=note-container-position-input]').value;
            let affiliation = note_div.querySelector('input[id=note-container-affiliation-input]').value;
            let role = note_div.querySelector('textarea[id=note-container-role]').value;
            let evidence = note_div.querySelector('textarea[id=note-container-evidence]').value;
            let confidence = 1;
            let ele = note_div.querySelectorAll('input[name=note-container-confidence]');
            for (let i=0; i<ele.length; i++) {
                if (ele[i].checked) confidence = i+1;
            }
            let disambig_args = {
                ref_text: ref_text,
                fullname: fullname,
                position: position,
                affiliation: affiliation,
                role: role,
                evidence: evidence,
                confidence: confidence,
                related_entities: data['entities']
            }
            console.log(disambig_args);
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {

                    let data = JSON.parse(xhttp.responseText);
                    console.log(data);
                    // collapse the annotation after submission
                    span_object.setAttribute("id", "ocid-"+data.ocid);
                    note_div.setAttribute('id', "ocid-"+data.ocid)
                    note_div.querySelector("div[class=note-content]").setAttribute('id', "ocid-"+data.ocid+"-content");
                    note_div.querySelector("div[class=note-content]").setAttribute('class', "collapse");
                    note_div.querySelector("p").innerHTML +=
                        "<button class=\"btn btn-primary\" type=\"button\" data-bs-toggle=\"collapse\" data-bs-target=\"#"+("ocid-"+data.ocid+"-content")+"\" aria-expanded=\"false\" aria-controls=\"collapseExample\">\n" +
                        "note" +
                        "  </button>";
                    // save the transcript with new annotation
                    let current_json = self.get_transcript_with_note();
                    var xhttp_update_json = new XMLHttpRequest();
                    xhttp_update_json.onreadystatechange = function () {
                        if (this.readyState == 4 && this.status == 200) {
                            // Typical action to be performed when the document is ready:
                            // document.getElementById("demo").innerHTML = xhttp.responseText;
                            let response = JSON.parse(xhttp_update_json.responseText);
                            console.log(response);

                        }
                    };
                    xhttp_update_json.open("POST", "http://0.0.0.0:8985/save_files/" + self.filename, true);
                    xhttp_update_json.setRequestHeader("Access-Control-Allow-Origin", "*");
                    xhttp_update_json.setRequestHeader("Content-Type", "application/json");
                    console.log(current_json);
                    xhttp_update_json.send(JSON.stringify(current_json),);
                }
            };
            let url = "http://0.0.0.0:8985/save_disambig";
            xhttp.open("POST", url, true);
            xhttp.setRequestHeader("Access-Control-Allow-Origin", "*");
            xhttp.setRequestHeader("Content-Type", "application/json");
            xhttp.send(JSON.stringify(disambig_args),);

        })
        
    }

}
