// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Locators } from "../Constants";
import { IModelAssessmentData } from "../IModelAssessmentData";

import {
  assertChartVisibility,
  getDefaultVisibleChart,
  ensureNotebookModelOverviewMetricChartIsCorrect
} from "./charts";
import { getNumberOfCohorts } from "./numberOfCohorts";

export function ensureAllModelOverviewDatasetCohortsViewBasicElementsArePresent(
  datasetShape: IModelAssessmentData,
  includeNewCohort: boolean,
  isNotebookTest: boolean,
  isVision: boolean
): void {
  const data = datasetShape.modelOverviewData;
  const initialCohorts = data?.initialCohorts;
  cy.get(Locators.ModelOverviewFeatureSelection).should("not.exist");
  cy.get(Locators.ModelOverviewFeatureConfigurationActionButton).should(
    "not.exist"
  );
  cy.get(Locators.ModelOverviewDatasetCohortStatsTable).should("exist");
  if (isNotebookTest) {
    if (
      getNumberOfCohorts(datasetShape, includeNewCohort) <= 1 ||
      datasetShape.isObjectDetection
    ) {
      cy.get(Locators.ModelOverviewHeatmapVisualDisplayToggle).should(
        "not.exist"
      );
    } else {
      cy.get(Locators.ModelOverviewHeatmapVisualDisplayToggle).should("exist");

      // checks the toggle is on
      cy.get(Locators.ModelOverviewHeatmapVisualDisplayToggle).should('have.attr', 'aria-checked', 'true');

      cy.get(Locators.ModelOverviewDatasetCohortStatsTable).find('path').should('have.attr', 'fill').and('include', 'rgb');

      // turns off the toggle
      cy.get(Locators.ModelOverviewHeatmapVisualDisplayToggle).click();

      // checks the toggle is off
      cy.get(Locators.ModelOverviewHeatmapVisualDisplayToggle).should('have.attr', 'aria-checked', 'false');

      // checks there are no RGB colors in the heatmap table
      cy.get(Locators.ModelOverviewDatasetCohortStatsTable).find('path').should('not.have.attr', 'fill', 'rgb');

    }
  }
  cy.get(Locators.ModelOverviewDisaggregatedAnalysisTable).should("not.exist");
  cy.get(Locators.ModelOverviewTableYAxisGrid).should(
    "include.text",
    initialCohorts?.[0].name
  );

  const metricsOrder: string[] = [];
  if (datasetShape.isRegression) {
    metricsOrder.push(
      "meanAbsoluteError",
      "meanSquaredError",
      "meanPrediction"
    );
  } else if (datasetShape.isImageClassification) {
    metricsOrder.push(
      "accuracy",
      "f1Score",
      "precisionScore",
      "recallScore",
      "falsePositiveRate",
      "falseNegativeRate",
      "selectionRate"
    );
  } else if (datasetShape.isMultiLabel) {
    metricsOrder.push("exactMatchRatio", "hammingScore");
  } else if (datasetShape.isObjectDetection) {
    metricsOrder.push(
      "meanAveragePrecision",
      "averagePrecision",
      "averageRecall"
    );
  } else {
    metricsOrder.push("accuracy");
    if (!datasetShape.isMulticlass) {
      metricsOrder.push(
        "falsePositiveRate",
        "falseNegativeRate",
        "selectionRate"
      );
    } else {
      metricsOrder.push(
        "macroF1Score",
        "macroPrecisionScore",
        "macroRecallScore"
      );
    }
  }

  const heatmapCellContents: string[] = [];
  const cohorts = initialCohorts?.concat(
    includeNewCohort && data?.newCohort ? [data.newCohort] : []
  );
  cohorts?.forEach((cohortData) => {
    heatmapCellContents.push(cohortData.sampleSize);
  });
  metricsOrder.forEach((metricName) => {
    cohorts?.forEach((cohortData) => {
      heatmapCellContents.push(cohortData.metrics[metricName]);
    });
  });

  cy.get(
    Locators.ModelOverviewDisaggregatedAnalysisBaseCohortDisclaimer
  ).should("not.exist");
  cy.get(Locators.ModelOverviewDisaggregatedAnalysisBaseCohortWarning).should(
    "not.exist"
  );

  if (!isVision) {
    if (isNotebookTest) {
      cy.get(Locators.ModelOverviewHeatmapCells)
        .should(
          "have.length",
          (cohorts?.length || 0) * (metricsOrder.length + 1)
        )
        .each(($cell) => {
          // somehow the cell string is one invisible character longer, trim
          expect($cell.text().slice(0, $cell.text().length - 1)).to.be.oneOf(
            heatmapCellContents
          );
        });
    }
    const defaultVisibleChart = getDefaultVisibleChart(
      datasetShape.isRegression,
      datasetShape.isBinary
    );
    assertChartVisibility(datasetShape, defaultVisibleChart);

    if (defaultVisibleChart === Locators.ModelOverviewMetricChart) {
      ensureNotebookModelOverviewMetricChartIsCorrect(
        isNotebookTest,
        datasetShape,
        includeNewCohort
      );
    }
  }
}
