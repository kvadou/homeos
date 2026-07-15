import XCTest

// The iOS pw-verify equivalent: launch the app, sign in with the dev account if
// the auth screen shows, then screenshot each of the 5 tabs. Attachments are kept
// in the .xcresult; extract them with `xcrun xcresulttool`.
//
// Dev-only credentials for the seeded demo account (documented in repo docs).
final class ScreenshotSweep: XCTestCase {
    private let email = "dev@homeos.local"
    private let password = "homeos-dev-2026!"
    private let tabs = ["Home", "Care", "Projects", "Library", "Ask"]

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
    }

    func testScreenshotSweep() {
        let app = XCUIApplication()
        app.launch()

        signInIfNeeded(app)
        dismissSavePasswordDialog()

        let tabBar = app.tabBars.firstMatch
        XCTAssertTrue(tabBar.waitForExistence(timeout: 30), "Tab bar never appeared")

        for name in tabs {
            let tab = app.tabBars.buttons[name]
            if tab.waitForExistence(timeout: 10) {
                tab.tap()
            }
            sleep(2) // let async loads + transitions settle
            let shot = XCTAttachment(screenshot: app.screenshot())
            shot.name = "tab-\(name)"
            shot.lifetime = .keepAlways
            add(shot)
        }
    }

    func testCoreInteractionFlows() {
        let app = XCUIApplication()
        app.launch()
        signInIfNeeded(app)
        dismissSavePasswordDialog()
        XCTAssertTrue(app.tabBars.firstMatch.waitForExistence(timeout: 30))

        app.tabBars.buttons["Care"].tap()
        let addCare = app.buttons["Add to Care"]
        XCTAssertTrue(addCare.waitForExistence(timeout: 10))
        addCare.tap()
        XCTAssertTrue(app.buttons["Add task"].waitForExistence(timeout: 3))
        app.buttons["Add task"].tap()
        XCTAssertTrue(app.navigationBars["New Task"].waitForExistence(timeout: 3))
        XCTAssertTrue(app.textFields["What needs attention?"].exists)
        app.buttons["Cancel"].tap()

        app.tabBars.buttons["Projects"].tap()
        let addProject = app.buttons["Add project"]
        XCTAssertTrue(addProject.waitForExistence(timeout: 10))
        addProject.tap()
        XCTAssertTrue(app.navigationBars["New Project"].waitForExistence(timeout: 3))
        XCTAssertTrue(app.textFields["Project name"].exists)
        XCTAssertFalse(app.buttons["Save"].isEnabled)
        app.buttons["Cancel"].tap()

        app.tabBars.buttons["Library"].tap()
        let addLibrary = app.buttons["Add"]
        XCTAssertTrue(addLibrary.waitForExistence(timeout: 10))
        addLibrary.tap()
        XCTAssertTrue(app.buttons["Add item"].waitForExistence(timeout: 3))
        app.coordinate(withNormalizedOffset: CGVector(dx: 0.15, dy: 0.25)).tap()

        app.tabBars.buttons["Ask"].tap()
        XCTAssertTrue(app.textFields["Ask about your home"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["Send"].isEnabled)
    }

    func testProjectCreateAndDelete() {
        let app = XCUIApplication()
        app.launch()
        signInIfNeeded(app)
        dismissSavePasswordDialog()
        XCTAssertTrue(app.tabBars.firstMatch.waitForExistence(timeout: 30))
        app.tabBars.buttons["Projects"].tap()

        let name = "UI verification \(Int(Date().timeIntervalSince1970))"
        let addProject = app.buttons["Add project"]
        XCTAssertTrue(addProject.waitForExistence(timeout: 10))
        addProject.tap()
        let nameField = app.textFields["Project name"]
        XCTAssertTrue(nameField.waitForExistence(timeout: 3))
        nameField.tap()
        nameField.typeText(name)
        app.buttons["Save"].tap()

        let created = app.staticTexts[name]
        XCTAssertTrue(created.waitForExistence(timeout: 10), "Created project never appeared")
        created.tap()
        XCTAssertTrue(app.navigationBars["Edit Project"].waitForExistence(timeout: 3))
        app.buttons["Delete Project"].tap()
        let confirmation = app.sheets.buttons["Delete Project"]
        XCTAssertTrue(confirmation.waitForExistence(timeout: 3))
        confirmation.tap()
        XCTAssertTrue(created.waitForNonExistence(timeout: 10), "Deleted project still appeared")
    }

    /// Drives the auth screen only if it appears; if a session is already
    /// persisted the app boots straight to the tab bar and this is a no-op.
    private func signInIfNeeded(_ app: XCUIApplication) {
        let signIn = app.buttons["Sign In"]
        let tabBar = app.tabBars.firstMatch

        // Wait for the app to settle into either auth or the signed-in shell.
        let deadline = Date().addingTimeInterval(30)
        while Date() < deadline && !signIn.exists && !tabBar.exists {
            usleep(200_000)
        }
        guard signIn.exists else { return }

        let emailField = app.textFields["Email"]
        if emailField.waitForExistence(timeout: 5) {
            emailField.tap()
            emailField.typeText(email)
        }
        let passwordField = app.secureTextFields["Password"]
        if passwordField.waitForExistence(timeout: 5) {
            passwordField.tap()
            passwordField.typeText(password)
        }
        if signIn.isHittable {
            signIn.tap()
        }
    }

    /// iOS offers to save the password to Keychain right after sign-in. Left up,
    /// this springboard alert covers the first screenshot and steals the first
    /// tab tap, so dismiss it before the sweep.
    private func dismissSavePasswordDialog() {
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        let notNow = springboard.buttons["Not Now"]
        if notNow.waitForExistence(timeout: 8) {
            notNow.tap()
        }
    }
}
