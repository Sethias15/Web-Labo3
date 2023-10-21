import * as utilities from "./utilities.js";

export default class CollectionFilter {
    constructor(objects, params, ModelClass) {
        this.objectsList = objects;
        this.params = params;
        this.model = ModelClass;
    }
    get() {
        let currentList = this.objectsList;
        const fields = this.findAllFields(currentList);

        if (this.params != null) {
            //Search (ex: fieldName=value)
            let searchParameters = this.verifyFields(Object.keys(this.params).join(","), fields);
            if (searchParameters != null && searchParameters.length > 0) {
                currentList = this.searchData(currentList, searchParameters);
            }

            //Field (ex: field=fieldName)
            if (this.params["field"] != null) {
                let desiredFields = this.verifyFields(this.params["field"], fields);
                this.sortData(currentList, desiredFields);

                let keepfieldsList = [];
                for (let data of currentList) {
                    let object = {};
                    for (let field of desiredFields) {
                        object[field] = data[field];
                    }
                    keepfieldsList.push(object);
                }
                this.flushDuplicates(keepfieldsList);
                currentList = keepfieldsList;
            }

            //Sort (ex:sort=fieldName[,desc])
            if (this.params["sort"] != null) {
                let sortFields = this.verifyFields(this.params["sort"], fields);
                let desc;
                var index = sortFields.indexOf("desc");
                if (index !== -1) desc = sortFields.splice(index, 1);
                this.sortData(currentList, sortFields, desc);
            }

            //Limit (ex: limit=nbItemsPerBlock [offset=blockIndex])
            let limit = this.params["limit"];
            if (limit != null) {
                let offset = this.params["offset"];
                if (offset == null) //I assume that we want the limit to work even if the offset is missing
                    offset = 0;
                currentList = currentList.slice(offset, parseInt(limit) + parseInt(offset));
            }
        }
        return currentList;
    }

    // Create a list of all fields in the list
    // Return a list of all fields in the list
    findAllFields(list) {
        let fields = [];
        for (let data of list)
            for (let key of Object.keys(data))
                if (!fields.includes(key))
                    fields.push(key);
        return fields;
    }

    // Verify that the desired fields are all valid fields
    // Return a list of all desiredFields included in the fields list or equal to "desc"
    verifyFields(desiredFields, fields) {
        let validFields = [];
        for (let desiredField of desiredFields.split(",")) {
            if (!validFields.includes(desiredField) &&
                (desiredField == "desc") || fields.includes(desiredField)) {
                validFields.push(desiredField);
            }
        }
        return validFields;
    }

    // Search all data which respects the search parameters
    // Return a list of the filtered data
    searchData(list, searchParameters) {
        let filteredList = [];
        for (let data of list) {
            let valid = true;
            for (let searchParam of searchParameters)
            valid = valid && this.isSearchedValue(data, searchParam);
        if (valid)
                filteredList.push(data);
        }
        return filteredList;
    }

    // Verify if the value of a field respects the search parameter received
    isSearchedValue(data, searchParam) {
        let searchedValue = this.params[searchParam];
        let truncatedValue = searchedValue.split("*").filter(i => i);

        if (searchedValue[0] == "*" && searchedValue[searchedValue.length - 1] == "*")
            return data[searchParam].includes(truncatedValue);
        else if (searchedValue[0] == "*")
            return data[searchParam].endsWith(truncatedValue);
        else if (searchedValue[searchedValue.length - 1] == "*")
            return data[searchParam].startsWith(truncatedValue);
        else
            return data[searchParam] == truncatedValue;
    }
    
    // Sort a list by the received parameters
    sortData(list, params, desc = null) {
        list.sort((a, b) => {
            var sortIndex;
            for (let param of params)
                sortIndex = sortIndex || String(a[param]).localeCompare(String(b[param]));
            if (desc != null) return sortIndex * -1;
            return sortIndex;
        });
    }

    // Removes the duplicates from the list received
    flushDuplicates(list) {
        if (list != null) {
            let indexToDelete = [];
            let index = 0;
            for (let data of list) {
                if (this.isSameData(data, list[index + 1]))
                    indexToDelete.push(index);
                index++;
            }
            utilities.deleteByIndex(list, indexToDelete);
        }
    }

    // Verify if two objects are equivalent
    isSameData(current, next) {
        if (next == null) return false;
        for (let key of Object.keys(current)) {
            if (current[key] != next[key]) return false;
        }
        return true;
    }

    static async create(req, res) {
        httpContext = new HttpContext(req, res);
        await httpContext.getJSONPayload();
        return httpContext;
    }
}