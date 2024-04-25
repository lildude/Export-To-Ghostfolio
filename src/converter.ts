import path from "path";
import * as fs from "fs";
import dayjs from "dayjs";
import { AbstractConverter } from "./converters/abstractconverter";
import { DeGiroConverter } from "./converters/degiroConverter";
import { DeGiroConverterV2 } from "./converters/degiroConverterV2";
import { EtoroConverter } from "./converters/etoroConverter";
import { FinpensionConverter } from "./converters/finpensionConverter";
import { FreetradeConverter } from "./converters/freetradeConverter";
import { GhostfolioExport } from "./models/ghostfolioExport";
import { IbkrConverter } from "./converters/ibkrConverter";
import { RabobankConverter } from "./converters/rabobankConverter";
import { SchwabConverter } from "./converters/schwabConverter";
import { SwissquoteConverter } from "./converters/swissquoteConverter";
import { Trading212Converter } from "./converters/trading212Converter";
import { XtbConverter } from "./converters/xtbConverter";
import { YahooFinanceService } from "./yahooFinanceService";

async function createAndRunConverter(converterType: string, inputFilePath: string, outputFilePath: string, completionCallback: CallableFunction, errorCallback: CallableFunction) {

    // Verify if Ghostolio account ID is set (because without it there can be no valid output).
    if (!process.env.GHOSTFOLIO_ACCOUNT_ID) {
        return errorCallback(new Error("Environment variable GHOSTFOLIO_ACCOUNT_ID not set!"));
    }

    // If DEBUG_LOGGING is enabled, set spaces to 2 else null for easier to read JSON output.
    const spaces = (Boolean(process.env.DEBUG_LOGGING) == true) ? 2 : null;

    const converterTypeLc = converterType.toLocaleLowerCase();

    // Determine convertor type.
    const converter = await createConverter(converterTypeLc);

    // Map the file to a Ghostfolio import.
    converter.readAndProcessFile(inputFilePath, (result: GhostfolioExport) => {

        console.log("[i] Processing complete, writing to file..")

        // Write result to file.
        const outputFileName = path.join(outputFilePath, `ghostfolio-${converterTypeLc}-${dayjs().format("YYYYMMDDHHmmss")}.json`);
        const fileContents = JSON.stringify(result);
        fs.writeFileSync(outputFileName, fileContents, { encoding: "utf-8" });

        console.log(`[i] Wrote data to '${outputFileName}'!`);

        completionCallback();

    }, (error) => errorCallback(error));
}

async function createConverter(converterType: string): Promise<AbstractConverter> {

    const yahooFinanceService = new YahooFinanceService();

    const cacheSize = await yahooFinanceService.loadCache();
    console.log(`[i] Restored ${cacheSize[0]} ISIN-symbol pairs and ${cacheSize[1]} symbols from cache..`);

    let converter: AbstractConverter;

    switch (converterType) {

        case "degiro":
            console.log("[i] Processing file using DeGiro converter");
            console.log("[i] NOTE: There is a new version available of the DeGiro converter");
            console.log("[i] The new converter has multiple record parsing improvements and also supports platform fees.");
            console.log("[i] The new converter is currently in beta and we're looking for your feedback!");
            console.log("[i] You can run the beta converter with the command 'npm run start degiro-v2'.");
            converter = new DeGiroConverter(yahooFinanceService);
            break;
        case "degiro-v2":
            console.log("[i] Processing file using DeGiro converter (V2 Beta)");
            console.log("[i] NOTE: You are running a converter that is currently in beta.");
            console.log("[i] If you have any issues, please report them on GitHub. Many thanks!");
            converter = new DeGiroConverterV2(yahooFinanceService);
            break;
        case "etoro":
            console.log("[i] Processing file using Etoro converter");
            converter = new EtoroConverter(yahooFinanceService);
            break;
        case "fp":
        case "finpension":
            console.log("[i] Processing file using Finpension converter");
            converter = new FinpensionConverter(yahooFinanceService);
            break;
        case "ft":
        case "freetrade":
            console.log("[i] Processing file using Freetrade converter");
            converter = new FreetradeConverter(yahooFinanceService);
            break;
        case "ibkr":
            console.log("[i] Processing file using IBKR converter");
            converter = new IbkrConverter(yahooFinanceService);
            break;
        case "rabobank":
            console.log("[i] Processing file using Rabobank converter");
            converter = new RabobankConverter(yahooFinanceService);
            break;
        case "schwab":
            console.log("[i] Processing file using Schwab converter");
            converter = new SchwabConverter(yahooFinanceService);
            break;
        case "sq":
        case "swissquote":
            console.log("[i] Processing file using Swissquote converter");
            converter = new SwissquoteConverter(yahooFinanceService);
            break;
        case "t212":
        case "trading212":
            console.log("[i] Processing file using Trading212 converter");
            converter = new Trading212Converter(yahooFinanceService);
            break;
        case "xtb":
            console.log("[i] Processing file using XTB converter");
            converter = new XtbConverter(yahooFinanceService);
            break;
        default:
            throw new Error(`Unknown converter '${converterType}' provided`);
    }

    return converter;
}

export {
    createAndRunConverter,
    createConverter
}
