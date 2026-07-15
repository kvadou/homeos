import SwiftUI

struct ServiceRequestView: View {
    @Environment(SupabaseService.self) private var supabase
    @Environment(\.dismiss) private var dismiss

    let item: Item
    let files: [HomeFile]
    let contractors: [Contractor]

    @State private var step = 0
    @State private var symptom = ""
    @State private var errorCode = ""
    @State private var urgency = "routine"
    @State private var safety = ServiceSafetyAnswers()
    @State private var start = Calendar.current.date(byAdding: .day, value: 1, to: Date()) ?? Date()
    @State private var end = Calendar.current.date(byAdding: .hour, value: 3, to: Calendar.current.date(byAdding: .day, value: 1, to: Date()) ?? Date()) ?? Date()
    @State private var availabilityNotes = ""
    @State private var selectedFiles = Set<String>()
    @State private var sharingApproved = false
    @State private var saving = false
    @State private var error: String?
    @State private var result: ServiceIntakeResponse?

    private let titles = ["What’s happening?", "Safety check", "Timing and records", "Review sharing"]

    var body: some View {
        NavigationStack {
            Group {
                if let result { ServiceCaseTimelineView(item: item, response: result, contractors: contractors) }
                else { intakeForm }
            }
            .navigationTitle(result == nil ? titles[step] : "Repair Help")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(result == nil ? "Close" : "Done") { dismiss() }
                }
            }
        }
        .interactiveDismissDisabled(saving)
    }

    private var intakeForm: some View {
        VStack(spacing: 0) {
            ProgressView(value: Double(step + 1), total: Double(titles.count))
                .tint(Color.homeNavy).padding(.horizontal).padding(.top, 8)
                .accessibilityLabel("Step \(step + 1) of \(titles.count)")
            Form {
                switch step {
                case 0: problemStep
                case 1: safetyStep
                case 2: timingStep
                default: sharingStep
                }
                if let error {
                    Section { Label(error, systemImage: "exclamationmark.circle.fill").foregroundStyle(.red) }
                }
            }
            .scrollContentBackground(.hidden)
            .background(Color.homeCanvas)
            footer
        }
        .background(Color.homeCanvas)
    }

    private var problemStep: some View {
        Group {
            Section {
                Text("Tell GatherRoot what changed. A specific symptom helps a provider understand the job before anyone is contacted.")
                    .font(.subheadline).foregroundStyle(.secondary)
                TextField("What is the item doing?", text: $symptom, axis: .vertical)
                    .lineLimit(3...6).accessibilityIdentifier("service-symptom")
                TextField("Error code, if shown", text: $errorCode)
            }
            Section("How soon do you need help?") {
                Picker("Urgency", selection: $urgency) {
                    Text("Routine").tag("routine")
                    Text("Within a few days").tag("soon")
                }.pickerStyle(.inline).labelsHidden()
            }
        }
    }

    private var safetyStep: some View {
        Group {
            Section {
                Text("Answer for what is happening now. If any item is true, GatherRoot will stop the request and show safer next steps.")
                    .font(.subheadline).foregroundStyle(.secondary)
            }
            Section("Do you notice any of these?") {
                Toggle("Gas or fuel smell", isOn: $safety.gasSmell)
                Toggle("Smoke, flame, or sparks", isOn: $safety.smokeOrSparks)
                Toggle("Shock or tingling", isOn: $safety.electricShock)
                Toggle("Active water near electricity", isOn: $safety.activeFloodingNearPower)
                Toggle("Carbon monoxide alarm", isOn: $safety.carbonMonoxideAlarm)
                Toggle("Severe overheating or burning odor", isOn: $safety.severeOverheating)
            }
            Section { Text("This check does not replace emergency services, a utility emergency line, or a qualified technician.").font(.footnote).foregroundStyle(.secondary) }
        }
    }

    private var timingStep: some View {
        Group {
            if !safety.hasStopCondition {
                Section("Preferred visit window") {
                    DatePicker("Start", selection: $start, in: Date()...)
                    DatePicker("End", selection: $end, in: start...)
                    TextField("Access or timing notes", text: $availabilityNotes, axis: .vertical).lineLimit(2...4)
                }
                Section("Records to include") {
                    if files.isEmpty {
                        Text("No photos or documents are linked to this item. You can continue without them.").foregroundStyle(.secondary)
                    } else {
                        ForEach(files) { file in
                            Toggle(isOn: fileSelection(file.id)) {
                                Label(file.name, systemImage: file.type == "photo" ? "photo" : "doc.text")
                            }
                        }
                    }
                    Text("Only records you select will be approved for this request.").font(.footnote).foregroundStyle(.secondary)
                }
            } else {
                Section {
                    Label("Stop using \(item.name)", systemImage: "exclamationmark.triangle.fill").font(.headline).foregroundStyle(.red)
                    Text("Move away from the immediate hazard. Call emergency services for immediate danger, and use your utility or manufacturer emergency number when appropriate.")
                }
                Section { Text("GatherRoot will save this safety result, but it will not contact or book a provider from this screen.").font(.subheadline).foregroundStyle(.secondary) }
            }
        }
    }

    private var sharingStep: some View {
        Group {
            Section("Repair request") {
                LabeledContent("Item", value: item.name)
                LabeledContent("Problem", value: symptom)
                if !errorCode.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { LabeledContent("Error code", value: errorCode) }
                LabeledContent("Records", value: "\(selectedFiles.count) selected")
            }
            Section("What GatherRoot may share") {
                Label("Item identity: maker, model, serial, and age when known", systemImage: "shippingbox")
                Label("Your problem description and safety answers", systemImage: "text.bubble")
                Label("Your preferred timing and service address", systemImage: "calendar")
                if !selectedFiles.isEmpty { Label("The \(selectedFiles.count) selected record\(selectedFiles.count == 1 ? "" : "s")", systemImage: "doc") }
            }
            Section {
                Button { sharingApproved.toggle() } label: {
                    Label("Approve this sharing scope", systemImage: sharingApproved ? "checkmark.square.fill" : "square")
                        .foregroundStyle(sharingApproved ? Color.homeNavy : Color.homeInk)
                }
                .accessibilityValue(sharingApproved ? "Approved" : "Not approved")
                .accessibilityIdentifier("service-share-approval")
                Text("Approval expires in 14 days. No provider is contacted and no appointment is booked until GatherRoot has real availability and you approve the specific option.")
                    .font(.footnote).foregroundStyle(.secondary)
            }
        }
    }

    private var footer: some View {
        HStack(spacing: 12) {
            if step > 0 { Button("Back") { error = nil; step -= 1 }.buttonStyle(.bordered).controlSize(.large) }
            Button(nextLabel) { Task { await advance() } }
                .buttonStyle(.borderedProminent).controlSize(.large).tint(safety.hasStopCondition ? .red : Color.homeNavy)
                .frame(maxWidth: .infinity, alignment: .trailing)
                .disabled(saving || (step == 0 && symptom.trimmingCharacters(in: .whitespacesAndNewlines).count < 3) || (step == 3 && !sharingApproved))
                .accessibilityIdentifier("service-next")
        }
        .padding().background(.bar)
    }

    private var nextLabel: String {
        if saving { return "Saving…" }
        if safety.hasStopCondition && step == 2 { return "Save safety result" }
        return step == 3 ? "Approve and create request" : "Continue"
    }

    private func fileSelection(_ id: String) -> Binding<Bool> {
        Binding(get: { selectedFiles.contains(id) }, set: { selected in
            if selected { selectedFiles.insert(id) } else { selectedFiles.remove(id) }
        })
    }

    private func advance() async {
        error = nil
        if safety.hasStopCondition && step == 2 { await save() }
        else if step < 3 { step += 1 }
        else { await save() }
    }

    private func save() async {
        saving = true
        defer { saving = false }
        do {
            result = try await supabase.createServiceCase(ServiceIntakeRequest(
                itemId: item.id, symptom: symptom, errorCode: errorCode.isBlank ? nil : errorCode,
                urgency: urgency, safety: safety,
                availability: ServiceAvailability(start: start.ISO8601Format(), end: end.ISO8601Format(), notes: availabilityNotes.isBlank ? nil : availabilityNotes),
                fileIds: Array(selectedFiles).sorted(), shareApproved: sharingApproved
            ))
        } catch { self.error = error.localizedDescription }
    }
}

private struct ServiceCaseTimelineView: View {
    let item: Item
    let response: ServiceIntakeResponse
    let contractors: [Contractor]

    var body: some View {
        List {
            Section {
                if response.safety.stopped {
                    Label("Safety stop saved", systemImage: "exclamationmark.triangle.fill").font(.title3.bold()).foregroundStyle(.red)
                    Text(response.safety.guidance).foregroundStyle(.secondary)
                } else {
                    Label("Request ready", systemImage: "checkmark.circle.fill").font(.title3.bold()).foregroundStyle(.green)
                    Text("Your repair details are saved and the exact sharing scope is approved.").foregroundStyle(.secondary)
                }
            }
            Section("Timeline") {
                timelineRow("Problem captured", detail: response.case.symptomSummary ?? item.name, done: true)
                timelineRow(response.safety.stopped ? "Safety stop" : "Safety check complete", detail: response.safety.stopped ? "Provider search did not begin" : "No immediate stop condition reported", done: true)
                if !response.safety.stopped {
                    timelineRow("Sharing approved", detail: "Approval expires automatically after 14 days", done: true)
                    timelineRow("Provider coordination", detail: contractors.isEmpty ? "Not started — founding provider coverage is not connected yet" : "Not started — saved contacts are not treated as verified availability", done: false)
                    timelineRow("Appointment", detail: "Nothing has been booked", done: false)
                }
            }
            if !response.safety.stopped {
                Section("What happens next") {
                    Text("GatherRoot will only show a provider after trade fit, trust signals, price terms, and real availability are available. You will approve the provider and appointment before anything is booked.")
                        .font(.subheadline).foregroundStyle(.secondary)
                }
            }
        }
        .scrollContentBackground(.hidden).background(Color.homeCanvas)
    }

    private func timelineRow(_ title: String, detail: String, done: Bool) -> some View {
        Label {
            VStack(alignment: .leading, spacing: 3) { Text(title); Text(detail).font(.caption).foregroundStyle(.secondary) }
        } icon: { Image(systemName: done ? "checkmark.circle.fill" : "circle").foregroundStyle(done ? .green : .secondary) }
        .padding(.vertical, 2)
    }
}
